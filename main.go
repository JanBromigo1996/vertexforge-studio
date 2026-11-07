//go:build windows

// VertexForge Studio – Windows-Desktop-Hülle
// ---------------------------------------------------------------------------
// Startet die eingebettete Web-App in einem nativen WebView2-Fenster und stellt
// ihr eine kleine Brücke zum System bereit:
//   - native Öffnen-/Speichern-Dialoge für .vforge-Projektdateien
//   - verknüpfte Dateien direkt im zugehörigen Programm öffnen (Blender, ZBrush …)
//   - Ordner im Explorer anzeigen, Pfade prüfen, Datei-Auswahl für Pfade
//   - Programm-Icons der auf dem PC installierten Software auslesen
//
// Daten liegen unter %LOCALAPPDATA%\VertexForge Studio.
package main

import (
	"bytes"
	"encoding/base64"
	"sort"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime/debug"
	"strings"
	"sync"
	"syscall"
	"time"
	"unicode/utf16"
	"unsafe"

	webview2 "github.com/jchv/go-webview2"
	"github.com/jchv/go-webview2/pkg/edge"
	"golang.org/x/sys/windows/registry"
	"vertexforge/winutil"
)

const (
	appName    = "VertexForge Studio"
	appVersion = "2.3.1"
	virtHost   = "vertexforge.example"
)

//go:embed app
var appFiles embed.FS

var (
	comdlg32          = syscall.NewLazyDLL("comdlg32.dll")
	procGetSaveName   = comdlg32.NewProc("GetSaveFileNameW")
	procGetOpenName   = comdlg32.NewProc("GetOpenFileNameW")
	shell32           = syscall.NewLazyDLL("shell32.dll")
	procShellExecute  = shell32.NewProc("ShellExecuteW")
	user32            = syscall.NewLazyDLL("user32.dll")
	kernel32 = syscall.NewLazyDLL("kernel32.dll")
	procMessageBox    = user32.NewProc("MessageBoxW")
	procSetErrorMode     = kernel32.NewProc("SetErrorMode")
	procGetLogicalDrives = kernel32.NewProc("GetLogicalDrives")
	procGetDriveType     = kernel32.NewProc("GetDriveTypeW")
	procSetForeground = user32.NewProc("SetForegroundWindow")
	procGetWindowLong = user32.NewProc("GetWindowLongPtrW")
	procSetWindowLong = user32.NewProc("SetWindowLongPtrW")
	procGetPlacement  = user32.NewProc("GetWindowPlacement")
	procSetPlacement  = user32.NewProc("SetWindowPlacement")
	procMonitorFromWn = user32.NewProc("MonitorFromWindow")
	procGetMonitorInf = user32.NewProc("GetMonitorInfoW")
	procSetWindowPos  = user32.NewProc("SetWindowPos")
	procIsZoomed      = user32.NewProc("IsZoomed")
	procGetKeyState   = user32.NewProc("GetKeyState")
	procShowWindowM   = user32.NewProc("ShowWindow")
	procReleaseCap    = user32.NewProc("ReleaseCapture")
	procSendMessage   = user32.NewProc("SendMessageW")
	procPostMessage   = user32.NewProc("PostMessageW")
	dwmapi            = syscall.NewLazyDLL("dwmapi.dll")
	procDwmExtend     = dwmapi.NewProc("DwmExtendFrameIntoClientArea")
	procDwmSetAttr    = dwmapi.NewProc("DwmSetWindowAttribute")
)

// ---- Rahmenloses Vollbild (F11) ----
type rect32 struct{ L, T, R, B int32 }
type monitorInfo struct {
	cbSize           uint32
	rcMonitor, rcWrk rect32
	dwFlags          uint32
}
type windowPlacement struct {
	length, flags, showCmd uint32
	ptMin, ptMax           [2]int32
	rcNormal               rect32
}

var fsState struct {
	on    bool
	style uintptr
	wp    windowPlacement
}

const (
	gwlStyle          = ^uintptr(15) // -16
	wsOverlappedWin   = 0x00CF0000
	swpNoOwnerZOrder  = 0x0200
	swpFrameChanged   = 0x0020
	swpNoMove         = 0x0002
	swpNoSize         = 0x0001
	swpNoZOrder       = 0x0004
	monitorDefNearest = 2
)

func toggleFullscreen(hwnd uintptr) bool {
	if !fsState.on {
		fsState.style, _, _ = procGetWindowLong.Call(hwnd, gwlStyle)
		fsState.wp.length = uint32(unsafe.Sizeof(fsState.wp))
		_, _, _ = procGetPlacement.Call(hwnd, uintptr(unsafe.Pointer(&fsState.wp)))
		mon, _, _ := procMonitorFromWn.Call(hwnd, monitorDefNearest)
		mi := monitorInfo{}
		mi.cbSize = uint32(unsafe.Sizeof(mi))
		_, _, _ = procGetMonitorInf.Call(mon, uintptr(unsafe.Pointer(&mi)))
		_, _, _ = procSetWindowLong.Call(hwnd, gwlStyle, fsState.style&^wsOverlappedWin)
		r := mi.rcMonitor
		_, _, _ = procSetWindowPos.Call(hwnd, 0, uintptr(r.L), uintptr(r.T), uintptr(r.R-r.L), uintptr(r.B-r.T), swpNoOwnerZOrder|swpFrameChanged)
		fsState.on = true
	} else {
		_, _, _ = procSetWindowLong.Call(hwnd, gwlStyle, fsState.style)
		_, _, _ = procSetPlacement.Call(hwnd, uintptr(unsafe.Pointer(&fsState.wp)))
		_, _, _ = procSetWindowPos.Call(hwnd, 0, 0, 0, 0, 0, swpNoMove|swpNoSize|swpNoZOrder|swpNoOwnerZOrder|swpFrameChanged)
		fsState.on = false
	}
	return fsState.on
}

// OPENFILENAMEW (x64-Layout, 152 Byte)
type openFileName struct {
	lStructSize       uint32
	hwndOwner         uintptr
	hInstance         uintptr
	lpstrFilter       *uint16
	lpstrCustomFilter *uint16
	nMaxCustFilter    uint32
	nFilterIndex      uint32
	lpstrFile         *uint16
	nMaxFile          uint32
	lpstrFileTitle    *uint16
	nMaxFileTitle     uint32
	lpstrInitialDir   *uint16
	lpstrTitle        *uint16
	flags             uint32
	nFileOffset       uint16
	nFileExtension    uint16
	lpstrDefExt       *uint16
	lCustData         uintptr
	lpfnHook          uintptr
	lpTemplateName    *uint16
	pvReserved        uintptr
	dwReserved        uint32
	flagsEx           uint32
}

const (
	ofnOverwritePrompt = 0x00000002
	ofnNoChangeDir     = 0x00000008
	ofnPathMustExist   = 0x00000800
	ofnFileMustExist   = 0x00001000
	ofnExplorer        = 0x00080000
)

// utf16Multi baut Filter-Strings mit eingebetteten Nullzeichen.
func utf16Multi(parts ...string) *uint16 {
	var buf []uint16
	for _, p := range parts {
		buf = append(buf, utf16.Encode([]rune(p))...)
		buf = append(buf, 0)
	}
	buf = append(buf, 0)
	return &buf[0]
}

func ptr(s string) *uint16 { p, _ := syscall.UTF16PtrFromString(s); return p }

func fileDialog(owner uintptr, save bool, title, suggested string, filter []string, defExt string) string {
	buf := make([]uint16, 32768)
	copy(buf, utf16.Encode([]rune(suggested)))
	ofn := openFileName{
		hwndOwner:    owner,
		lpstrFilter:  utf16Multi(filter...),
		nFilterIndex: 1,
		lpstrFile:    &buf[0],
		nMaxFile:     uint32(len(buf)),
		lpstrTitle:   ptr(title),
		flags:        ofnExplorer | ofnNoChangeDir | ofnPathMustExist,
	}
	ofn.lStructSize = uint32(unsafe.Sizeof(ofn))
	if defExt != "" {
		ofn.lpstrDefExt = ptr(defExt)
	}
	proc := procGetOpenName
	if save {
		ofn.flags |= ofnOverwritePrompt
		proc = procGetSaveName
	} else {
		ofn.flags |= ofnFileMustExist
	}
	r, _, _ := proc.Call(uintptr(unsafe.Pointer(&ofn)))
	if r == 0 {
		return ""
	}
	return syscall.UTF16ToString(buf)
}

func shellOpen(owner uintptr, target string) error {
	r, _, err := procShellExecute.Call(owner, uintptr(unsafe.Pointer(ptr("open"))), uintptr(unsafe.Pointer(ptr(target))), 0, 0, 1)
	if r <= 32 {
		return err
	}
	return nil
}

func messageBox(text, caption string, flags uintptr) {
	_, _, _ = procMessageBox.Call(0, uintptr(unsafe.Pointer(ptr(text))), uintptr(unsafe.Pointer(ptr(caption))), flags)
}

// writeAtomic schreibt zuerst in eine Temp-Datei und benennt dann um –
// so bleibt bei einem Absturz die alte Projektdatei erhalten.
func writeAtomic(path, content string) error {
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, []byte(content), 0o644); err != nil {
		return err
	}
	if _, err := os.Stat(path); err == nil {
		_ = os.Remove(path + ".bak")
		_ = os.Rename(path, path+".bak")
	}
	return os.Rename(tmp, path)
}

// extractApp kopiert die eingebettete Web-App in den Programmordner
// (nur geänderte Dateien – so stören sich mehrere offene Fenster nicht).
func extractApp(dst string) error {
	return fs.WalkDir(appFiles, "app", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel := strings.TrimPrefix(p, "app")
		target := filepath.Join(dst, filepath.FromSlash(rel))
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		b, err := appFiles.ReadFile(p)
		if err != nil {
			return err
		}
		if old, err := os.ReadFile(target); err == nil && bytes.Equal(old, b) {
			return nil
		}
		return os.WriteFile(target, b, 0o644)
	})
}

// systemIcons liest per PowerShell die Icons der Programme, die auf diesem PC
// mit den angegebenen Dateiendungen verknüpft sind (PNG, Base64).
// iconReq beschreibt, wie ein Programm auf diesem PC gefunden wird.
type iconReq struct {
	Key  string   `json:"key"`
	Exe  []string `json:"exe"`  // Dateinamen für "App Paths" (z. B. Photoshop.exe)
	Lnk  []string `json:"lnk"`  // Startmenü-Verknüpfungen (Wildcards)
	Glob []string `json:"glob"` // bekannte Installationsorte (Wildcards)
	Ext  string   `json:"ext"`  // Rückfall: Icon der Dateizuordnung
	Path string   `json:"path"` // vom Nutzer verknüpfte Programmdatei
}

// Programm-Icons ohne Hilfsprozesse finden: App-Paths-Registry → Startmenü-Verknüpfungen →
// bekannte Installationsordner → Dateizuordnung. Ergebnis: key -> data-URL (PNG, 64 px).
var procAssocQuery = syscall.NewLazyDLL("shlwapi.dll").NewProc("AssocQueryStringW")

func appPathExe(name string) string {
	for _, root := range []registry.Key{registry.LOCAL_MACHINE, registry.CURRENT_USER} {
		k, err := registry.OpenKey(root, `SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\`+name, registry.QUERY_VALUE)
		if err != nil {
			continue
		}
		v, _, err := k.GetStringValue("")
		k.Close()
		if err == nil {
			v = strings.Trim(v, `"`)
			if fi, e := os.Stat(v); e == nil && !fi.IsDir() {
				return v
			}
		}
	}
	return ""
}

func assocExe(ext string) string {
	if ext == "" {
		return ""
	}
	e, _ := syscall.UTF16PtrFromString("." + ext)
	buf := make([]uint16, 1024)
	n := uint32(len(buf))
	r, _, _ := procAssocQuery.Call(0, 2 /*ASSOCSTR_EXECUTABLE*/, uintptr(unsafe.Pointer(e)), 0, uintptr(unsafe.Pointer(&buf[0])), uintptr(unsafe.Pointer(&n)))
	if r != 0 {
		return ""
	}
	p := syscall.UTF16ToString(buf)
	low := strings.ToLower(p)
	// Generische Windows-Programme (Fotos, Öffnen-mit …) liefern kein passendes Icon
	if strings.Contains(low, "rundll32") || strings.Contains(low, "openwith") || strings.Contains(low, "explorer.exe") || strings.Contains(low, "windowsapps") {
		return ""
	}
	if fi, err := os.Stat(p); err == nil && !fi.IsDir() {
		return p
	}
	return ""
}

func startMenuLinks() []string {
	var out []string
	roots := []string{winutil.CommonPrograms(), filepath.Join(os.Getenv("APPDATA"), `Microsoft\Windows\Start Menu\Programs`), winutil.CommonDesktop(), filepath.Join(os.Getenv("USERPROFILE"), "Desktop")}
	for _, r := range roots {
		_ = filepath.WalkDir(r, func(p string, d fs.DirEntry, err error) error {
			if err == nil && !d.IsDir() && strings.EqualFold(filepath.Ext(p), ".lnk") {
				out = append(out, p)
			}
			return nil
		})
	}
	return out
}

func systemIcons(reqs []iconReq) map[string]string {
	res := map[string]string{}
	links := startMenuLinks()
	bad := func(t string) bool {
		l := strings.ToLower(filepath.Base(t))
		return strings.Contains(l, "unins") || strings.Contains(l, "crash") || strings.Contains(l, "update")
	}
	for _, r := range reqs {
		key := strings.ToLower(r.Key)
		exe := ""
		if strings.HasSuffix(strings.ToLower(r.Path), ".exe") {
			if _, err := os.Stat(r.Path); err == nil {
				exe = r.Path
			}
		}
		for _, n := range r.Exe {
			if exe == "" {
				exe = appPathExe(n)
			}
		}
		if exe == "" {
		outer:
			for _, pat := range r.Lnk {
				for _, l := range links {
					base := strings.TrimSuffix(filepath.Base(l), filepath.Ext(l))
					if ok, _ := filepath.Match(strings.ToLower(pat), strings.ToLower(base)); ok {
						if t := winutil.LnkTarget(l); t != "" && strings.EqualFold(filepath.Ext(t), ".exe") && !bad(t) {
							if _, err := os.Stat(t); err == nil {
								exe = t
								break outer
							}
						}
					}
				}
			}
		}
		if exe == "" {
			for _, g := range r.Glob {
				if m, _ := filepath.Glob(g); len(m) > 0 {
					sort.Sort(sort.Reverse(sort.StringSlice(m)))
					exe = m[0]
					break
				}
			}
		}
		if exe == "" {
			exe = assocExe(strings.ToLower(r.Ext))
		}
		if exe == "" {
			continue
		}
		if b, err := winutil.IconPNG(exe, 64); err == nil {
			res[key] = "data:image/png;base64," + base64.StdEncoding.EncodeToString(b)
		} else {
			log.Printf("icon %s: %v", exe, err)
		}
	}
	return res
}

func exePath() string {
	p, err := os.Executable()
	if err != nil {
		return ""
	}
	return p
}

func main() {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base, _ = os.UserCacheDir()
	}
	base = filepath.Join(base, appName)
	_ = os.MkdirAll(base, 0o755)
	if lf, err := os.OpenFile(filepath.Join(base, "vertexforge.log"), os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644); err == nil {
		log.SetOutput(lf)
		defer lf.Close()
	}
	log.Printf("VertexForge Studio %s – Start (%s)", appVersion, exePath())
	// Keine Windows-Fehlerdialoge („Kein Datenträger im Laufwerk“) beim Prüfen von Laufwerken
	procSetErrorMode.Call(0x0001 | 0x8000) // SEM_FAILCRITICALERRORS | SEM_NOOPENFILEERRORBOX
	// Unerwartete Fehler nicht stumm verschlucken, sondern melden
	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC: %v\n%s", r, debug.Stack())
			messageBox(fmt.Sprintf("VertexForge Studio konnte nicht starten / could not start:\n\n%v\n\nLog: %s", r, filepath.Join(base, "vertexforge.log")), appName, 0x10)
		}
	}()
	// Arbeitsordner = Programmordner, damit die Microsoft-DLL daneben sicher gefunden wird
	if exe := exePath(); exe != "" {
		_ = os.Chdir(filepath.Dir(exe))
	}
	appDir := filepath.Join(base, "app")
	if err := extractApp(appDir); err != nil {
		messageBox("App-Dateien konnten nicht entpackt werden:\n"+err.Error(), appName, 0x10)
		return
	}

	// Eigene, ins Design integrierte Titelleiste statt der Windows-Leiste.
	webview2.Frameless = true
	w := webview2.NewWithOptions(webview2.WebViewOptions{
		Debug:     false,
		AutoFocus: true,
		DataPath:  filepath.Join(base, "WebView2"),
		WindowOptions: webview2.WindowOptions{
			Title: appName, Width: 1480, Height: 920, IconId: 1, Center: true,
		},
	})
	if w == nil {
		log.Printf("WebView2 konnte nicht gestartet werden")
		messageBox("Microsoft Edge WebView2 Runtime wurde nicht gefunden.\n\nBitte installiere sie (kostenlos) und starte VertexForge Studio erneut.\n\n"+
			"Microsoft Edge WebView2 Runtime is missing. Please install it and restart.", appName, 0x30)
		_ = shellOpen(0, "https://go.microsoft.com/fwlink/p/?LinkId=2124703")
		return
	}
	defer w.Destroy()
	w.SetSize(1024, 640, webview2.HintMin)

	type patched interface {
		Chromium() *edge.Chromium
		DestroyNow()
	}
	pw := w.(patched)
	hwnd := uintptr(w.Window())
	chromium := pw.Chromium()

	// Browser-spezifische Kürzel (F5, Strg+P, F3-Suche …) abschalten – die App hat eigene.
	if st, err := chromium.GetSettings(); err == nil {
		_ = st.PutAreBrowserAcceleratorKeysEnabled(false)
		_ = st.PutIsZoomControlEnabled(false)
		_ = st.PutIsStatusBarEnabled(false)
		_ = st.PutAreDefaultScriptDialogsEnabled(true)
	}

	// Stabile, sichere Herkunft (https) für Speicher, Zwischenablage und Fonts.
	startURL := "file:///" + filepath.ToSlash(filepath.Join(appDir, "index.html"))
	if wv3 := chromium.GetICoreWebView2_3(); wv3 != nil {
		if err := wv3.SetVirtualHostNameToFolderMapping(virtHost, appDir, edge.COREWEBVIEW2_HOST_RESOURCE_ACCESS_KIND_ALLOW); err == nil {
			startURL = "https://" + virtHost + "/index.html"
		} else {
			log.Printf("virtual host: %v", err)
		}
		// Verknüpfte Bilder/Videos direkt von der Festplatte anzeigen (nur lesend, nur in dieser App).
		// Nur feste und Wechsel-Laufwerke mit Datenträger – Netzlaufwerke können beim Start lange hängen.
		drives, _, _ := procGetLogicalDrives.Call()
		for c := 'C'; c <= 'Z'; c++ {
			if drives&(1<<uint(c-'A')) == 0 {
				continue
			}
			root := string(c) + `:\`
			if t, _, _ := procGetDriveType.Call(uintptr(unsafe.Pointer(ptr(root)))); t != 2 && t != 3 { // REMOVABLE, FIXED
				continue
			}
			if fi, err := os.Stat(root); err == nil && fi.IsDir() {
				_ = wv3.SetVirtualHostNameToFolderMapping("drive-"+strings.ToLower(string(c))+".vertexforge.example", root, edge.COREWEBVIEW2_HOST_RESOURCE_ACCESS_KIND_ALLOW)
			}
		}
	}

	// ---- Schließen: der App Zeit geben, alles zu sichern ----
	var mu sync.Mutex
	closing, acked := false, false
	webview2.CloseHook = func() bool {
		mu.Lock()
		defer mu.Unlock()
		if closing {
			return false
		}
		closing, acked = true, false
		w.Eval("window.__vfBeforeClose ? window.__vfBeforeClose() : vfCloseNow()")
		go func() {
			time.Sleep(2500 * time.Millisecond)
			mu.Lock()
			stuck := closing && !acked
			mu.Unlock()
			if stuck {
				w.Dispatch(func() { pw.DestroyNow() })
			}
		}()
		return true
	}
	_ = w.Bind("vfCloseAck", func() { mu.Lock(); acked = true; mu.Unlock() })
	_ = w.Bind("vfCloseCancel", func() { mu.Lock(); closing = false; mu.Unlock() })
	_ = w.Bind("vfCloseNow", func() { w.Dispatch(func() { pw.DestroyNow() }) })

	// ---- Systembrücke ----
	_ = w.Bind("vfInfo", func() map[string]string {
		lang := ""
		if b, err := os.ReadFile(filepath.Join(base, "setup-lang.txt")); err == nil {
			lang = strings.TrimSpace(string(b))
		}
		return map[string]string{"version": appVersion, "platform": "windows", "dataDir": base, "lang": lang}
	})
	_ = w.Bind("vfSetTitle", func(t string) { w.SetTitle(t) })
	// Native UI-Zoom (Strg+Mausrad / Strg +/-/0) – scharf, ohne CSS-Tricks.
	_ = w.Bind("vfSetZoom", func(z float64) float64 {
		if z < 0.5 {
			z = 0.5
		}
		if z > 2.5 {
			z = 2.5
		}
		w.Dispatch(func() {
			if c := chromium.GetController(); c != nil {
				if err := c.PutZoomFactor(z); err != nil {
					log.Printf("zoom: %v", err)
				}
			}
		})
		return z
	})
	// UI-Zoom-Tasten zuverlässig abfangen (WebView2 schluckt Strg+0 sonst teilweise).
	chromium.AcceleratorKeyCallback = func(vk uint) bool {
		ks, _, _ := procGetKeyState.Call(0x11) // VK_CONTROL
		if int16(ks) >= 0 {
			return false
		}
		dir := ""
		switch vk {
		case 0x30, 0x60:
			dir = "0"
		case 0xBB, 0x6B:
			dir = "1"
		case 0xBD, 0x6D:
			dir = "-1"
		}
		if dir == "" {
			return false
		}
		w.Dispatch(func() { w.Eval("window.vfZoomKey && window.vfZoomKey(" + dir + ")") })
		return true
	}
	// Kein weißes Aufblitzen beim Start: Hintergrund wie das App-Design.
	if c := chromium.GetController(); c != nil {
		if c2 := c.GetICoreWebView2Controller2(); c2 != nil {
			_ = c2.PutDefaultBackgroundColor(edge.COREWEBVIEW2_COLOR{A: 255, R: 0x14, G: 0x13, B: 0x16})
		}
	}
	// Fensterschatten & Snap trotz eigener Titelleiste behalten.
	{
		m := [4]int32{1, 1, 1, 1}
		_, _, _ = procDwmExtend.Call(hwnd, uintptr(unsafe.Pointer(&m)))
		dark := int32(1)
		_, _, _ = procDwmSetAttr.Call(hwnd, 20, uintptr(unsafe.Pointer(&dark)), 4) // DWMWA_USE_IMMERSIVE_DARK_MODE
		_, _, _ = procSetWindowPos.Call(hwnd, 0, 0, 0, 0, 0, 0x0001|0x0002|0x0004|0x0020) // FRAMECHANGED
	}
	winState := func() map[string]bool {
		z, _, _ := procIsZoomed.Call(hwnd)
		return map[string]bool{"max": z != 0, "full": fsState.on}
	}
	_ = w.Bind("vfWinState", func() map[string]bool { return winState() })
	// Titelleiste: Ziehen, Größe ändern, Minimieren, Maximieren, Schließen.
	_ = w.Bind("vfWin", func(action string) map[string]bool {
		st := winState()
		switch action {
		case "min":
			w.Dispatch(func() { _, _, _ = procShowWindowM.Call(hwnd, 6) })
		case "max":
			if fsState.on {
				w.Dispatch(func() { toggleFullscreen(hwnd) })
				st["full"] = false
				break
			}
			cmd := uintptr(3)
			if st["max"] {
				cmd = 9
			}
			st["max"] = !st["max"]
			w.Dispatch(func() { _, _, _ = procShowWindowM.Call(hwnd, cmd) })
		case "close":
			_, _, _ = procPostMessage.Call(hwnd, 0x0010, 0, 0)
		case "drag":
			if !fsState.on {
				w.Dispatch(func() {
					_, _, _ = procReleaseCap.Call()
					_, _, _ = procSendMessage.Call(hwnd, 0x00A1, 2, 0) // WM_NCLBUTTONDOWN, HTCAPTION
				})
			}
		default:
			ht := map[string]uintptr{"l": 10, "r": 11, "t": 12, "tl": 13, "tr": 14, "b": 15, "bl": 16, "br": 17}
			if strings.HasPrefix(action, "resize:") && !fsState.on && !st["max"] {
				if code, ok := ht[strings.TrimPrefix(action, "resize:")]; ok {
					w.Dispatch(func() {
						_, _, _ = procReleaseCap.Call()
						_, _, _ = procSendMessage.Call(hwnd, 0x00A1, code, 0)
					})
				}
			}
		}
		return st
	})
	_ = w.Bind("vfWinTheme", func(dark bool) bool {
		v := int32(0)
		if dark {
			v = 1
		}
		w.Dispatch(func() { _, _, _ = procDwmSetAttr.Call(hwnd, 20, uintptr(unsafe.Pointer(&v)), 4) })
		return dark
	})
	_ = w.Bind("vfFullscreen", func() bool {
		next := !fsState.on
		w.Dispatch(func() { toggleFullscreen(hwnd) })
		return next
	})
	projectFilter := []string{"VertexForge-Projekt (*.vforge)", "*.vforge", "JSON (*.json)", "*.json", "Alle Dateien (*.*)", "*.*"}
	// Dialoge laufen über Dispatch in der Hauptschleife (nicht im WebView2-Event-Handler)
	// und melden ihr Ergebnis über window.__vfResolve(id, result, error) zurück.
	resolve := func(id int, v interface{}, err error) {
		b, _ := json.Marshal(v)
		e := "null"
		if err != nil {
			eb, _ := json.Marshal(err.Error())
			e = string(eb)
		}
		w.Eval(fmt.Sprintf("window.__vfResolve && window.__vfResolve(%d,%s,%s)", id, string(b), e))
	}
	_ = w.Bind("vfSaveFileAs", func(id int, name, content string) {
		w.Dispatch(func() {
			p := fileDialog(hwnd, true, "Projekt speichern", name, projectFilter, "vforge")
			var err error
			if p != "" {
				err = writeAtomic(p, content)
			}
			resolve(id, p, err)
		})
	})
	_ = w.Bind("vfWriteFile", func(path, content string) error { return writeAtomic(path, content) })
	_ = w.Bind("vfOpenFile", func(id int) {
		w.Dispatch(func() {
			p := fileDialog(hwnd, false, "Projekt öffnen", "", projectFilter, "")
			if p == "" {
				resolve(id, map[string]string{}, nil)
				return
			}
			b, err := os.ReadFile(p)
			resolve(id, map[string]string{"path": p, "content": string(b)}, err)
		})
	})
	_ = w.Bind("vfPickPath", func(id int) {
		w.Dispatch(func() {
			resolve(id, fileDialog(hwnd, false, "Datei verknüpfen", "", []string{"Alle Dateien (*.*)", "*.*"}, ""), nil)
		})
	})
	_ = w.Bind("vfOpenPath", func(p string) error {
		if _, err := os.Stat(p); err != nil {
			return err
		}
		w.Dispatch(func() { _ = shellOpen(hwnd, p) })
		return nil
	})
	_ = w.Bind("vfRevealPath", func(p string) error {
		if st, err := os.Stat(p); err == nil && st.IsDir() {
			return shellOpen(hwnd, p)
		}
		cmd := exec.Command("explorer.exe", "/select,", p)
		return cmd.Start()
	})
	_ = w.Bind("vfOpenURL", func(u string) error {
		if strings.HasPrefix(u, "https://") || strings.HasPrefix(u, "http://") {
			return shellOpen(hwnd, u)
		}
		return nil
	})
	_ = w.Bind("vfExists", func(paths []string) map[string]bool {
		res := map[string]bool{}
		for _, p := range paths {
			_, err := os.Stat(p)
			res[p] = err == nil
		}
		return res
	})
	_ = w.Bind("vfIcons", func(reqs []iconReq) bool {
		go func() {
			icons := systemIcons(reqs)
			b, _ := json.Marshal(icons)
			w.Dispatch(func() { w.Eval("window.vfOnIcons && window.vfOnIcons(" + string(b) + ")") })
		}()
		return true
	})

	w.Navigate(startURL)
	_, _, _ = procSetForeground.Call(hwnd)
	w.Run()
}
