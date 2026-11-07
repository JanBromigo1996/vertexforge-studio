//go:build windows

// VertexForge Studio – Setup & Deinstallation.
// Ein kleines, rahmenloses WebView2-Fenster mit eigenem Assistenten:
// Programm nach "Programme" kopieren, Desktop- und Startmenü-Verknüpfung,
// Eintrag unter "Apps & Features" inkl. Deinstallationsprogramm.
package main

import (
	"archive/zip"
	"bytes"
	_ "embed"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"unsafe"

	webview2 "github.com/jchv/go-webview2"
	"github.com/jchv/go-webview2/pkg/edge"
	"golang.org/x/sys/windows/registry"
	"vertexforge/winutil"
)

const (
	appName    = "VertexForge Studio"
	appVersion = "2.3.0"
	publisher  = "VertexForge"
	exeName    = "VertexForge Studio.exe"
	uninstName = "Uninstall VertexForge Studio.exe"
	regKey     = `Software\Microsoft\Windows\CurrentVersion\Uninstall\VertexForgeStudio`
)

//go:embed ui.html
var uiHTML string

//go:embed logo.png
var logoPNG []byte

var (
	user32         = syscall.NewLazyDLL("user32.dll")
	procMessageBox = user32.NewProc("MessageBoxW")
	procShowWindow = user32.NewProc("ShowWindow")
	procReleaseCap = user32.NewProc("ReleaseCapture")
	procSendMsg    = user32.NewProc("SendMessageW")
	procPostMsg    = user32.NewProc("PostMessageW")
	procSetWinPos  = user32.NewProc("SetWindowPos")
	dwmapi         = syscall.NewLazyDLL("dwmapi.dll")
	procDwmExtend  = dwmapi.NewProc("DwmExtendFrameIntoClientArea")
	procDwmSetAttr = dwmapi.NewProc("DwmSetWindowAttribute")
	shell32        = syscall.NewLazyDLL("shell32.dll")
	procShellExec  = shell32.NewProc("ShellExecuteW")
	procMoveFileEx = syscall.NewLazyDLL("kernel32.dll").NewProc("MoveFileExW")
)

func messageBox(text, title string, flags uintptr) {
	t, _ := syscall.UTF16PtrFromString(text)
	c, _ := syscall.UTF16PtrFromString(title)
	_, _, _ = procMessageBox.Call(0, uintptr(unsafe.Pointer(t)), uintptr(unsafe.Pointer(c)), flags)
}

func defaultDir() string {
	pf := os.Getenv("ProgramW6432")
	if pf == "" {
		pf = os.Getenv("ProgramFiles")
	}
	if pf == "" {
		pf = `C:\Program Files`
	}
	return filepath.Join(pf, appName)
}

// Bereits installiert? Dann diesen Ordner vorschlagen.
func existingDir() string {
	k, err := registry.OpenKey(registry.LOCAL_MACHINE, regKey, registry.QUERY_VALUE)
	if err != nil {
		return ""
	}
	defer k.Close()
	v, _, err := k.GetStringValue("InstallLocation")
	if err != nil {
		return ""
	}
	return v
}

func appRunning() bool {
	dir := existingDir()
	if dir == "" {
		return false
	}
	return winutil.Running(filepath.Join(dir, exeName))
}

func shortcutPaths() (desktop, startMenu string) {
	return filepath.Join(winutil.CommonDesktop(), appName+".lnk"), filepath.Join(winutil.CommonPrograms(), appName+".lnk")
}

func makeShortcut(lnk, target, dir string) error {
	return winutil.WriteLnk(lnk, target, dir, "VertexForge Studio – pipeline & planning for 3D artists", target)
}

type installOpts struct {
	Dir       string `json:"dir"`
	Desktop   bool   `json:"desktop"`
	StartMenu bool   `json:"startMenu"`
	Lang      string `json:"lang"`
}

var langOK = map[string]bool{"en": true, "de": true, "fr": true, "es": true, "it": true, "pt": true}

func storedLang() string {
	k, err := registry.OpenKey(registry.LOCAL_MACHINE, regKey, registry.QUERY_VALUE)
	if err != nil {
		return ""
	}
	defer k.Close()
	v, _, _ := k.GetStringValue("Language")
	if langOK[v] {
		return v
	}
	return ""
}

func install(o installOpts, progress func(p float64, step string)) error {
	dir := strings.TrimSpace(o.Dir)
	if dir == "" {
		return fmt.Errorf("kein Zielordner")
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	progress(0.05, "files")
	// Programmdateien aus dem komprimierten Paket entpacken (wie bei üblichen Installern)
	zr, err := zip.NewReader(bytes.NewReader(payload), int64(len(payload)))
	if err != nil {
		return err
	}
	total := uint64(0)
	for _, zf := range zr.File {
		total += zf.UncompressedSize64
	}
	done := uint64(0)
	for _, zf := range zr.File {
		name := filepath.Base(zf.Name) // nur flache Dateinamen
		dst := filepath.Join(dir, name)
		if err := extractFile(zf, dst, func(n int) {
			done += uint64(n)
			progress(0.05+0.6*float64(done)/float64(total+1), "files")
		}); err != nil {
			return err
		}
	}
	target := filepath.Join(dir, exeName)
	progress(0.68, "shortcuts")
	desk, start := shortcutPaths()
	if o.Desktop {
		if err := makeShortcut(desk, target, dir); err != nil {
			log.Printf("desktop shortcut: %v", err)
		}
	} else {
		_ = os.Remove(desk)
	}
	if o.StartMenu {
		if err := makeShortcut(start, target, dir); err != nil {
			log.Printf("start menu shortcut: %v", err)
		}
	} else {
		_ = os.Remove(start)
	}
	progress(0.86, "register")
	k, _, err := registry.CreateKey(registry.LOCAL_MACHINE, regKey, registry.ALL_ACCESS)
	if err == nil {
		_ = k.SetStringValue("DisplayName", appName)
		_ = k.SetStringValue("DisplayVersion", appVersion)
		_ = k.SetStringValue("Publisher", publisher)
		_ = k.SetStringValue("DisplayIcon", target+",0")
		_ = k.SetStringValue("InstallLocation", dir)
		_ = k.SetStringValue("InstallDate", time.Now().Format("20060102"))
		_ = k.SetStringValue("UninstallString", `"`+filepath.Join(dir, uninstName)+`" /uninstall`)
		_ = k.SetStringValue("QuietUninstallString", `"`+filepath.Join(dir, uninstName)+`" /uninstall /quiet`)
		_ = k.SetDWordValue("EstimatedSize", uint32(payloadSize() / 1024))
		_ = k.SetDWordValue("NoModify", 1)
		_ = k.SetDWordValue("NoRepair", 1)
		if langOK[o.Lang] {
			_ = k.SetStringValue("Language", o.Lang)
		}
		k.Close()
	} else {
		log.Printf("registry: %v", err)
	}
	// Gewählte Sprache als Startsprache der App hinterlegen (gilt nur für den allerersten Start)
	if langOK[o.Lang] {
		if base := os.Getenv("LOCALAPPDATA"); base != "" {
			d := filepath.Join(base, appName)
			_ = os.MkdirAll(d, 0o755)
			_ = os.WriteFile(filepath.Join(d, "setup-lang.txt"), []byte(o.Lang), 0o644)
		}
	}
	progress(1, "done")
	return nil
}

func extractFile(zf *zip.File, dst string, step func(int)) error {
	rc, err := zf.Open()
	if err != nil {
		return err
	}
	defer rc.Close()
	tmp := dst + ".new"
	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	buf := make([]byte, 256*1024)
	for {
		n, rerr := rc.Read(buf)
		if n > 0 {
			if _, werr := f.Write(buf[:n]); werr != nil {
				f.Close()
				return werr
			}
			step(n)
		}
		if rerr == io.EOF {
			break
		}
		if rerr != nil {
			f.Close()
			return rerr
		}
	}
	f.Close()
	_ = os.Remove(dst)
	return os.Rename(tmp, dst)
}

// Unkomprimierte Größe des Pakets (für Anzeige und "Apps & Features")
func payloadSize() uint64 {
	zr, err := zip.NewReader(bytes.NewReader(payload), int64(len(payload)))
	if err != nil {
		return 0
	}
	t := uint64(0)
	for _, zf := range zr.File {
		t += zf.UncompressedSize64
	}
	return t
}

func uninstall(removeData bool, progress func(p float64, step string)) error {
	dir := existingDir()
	if dir == "" {
		self, _ := os.Executable()
		dir = filepath.Dir(self)
	}
	progress(0.2, "shortcuts")
	desk, start := shortcutPaths()
	_ = os.Remove(desk)
	_ = os.Remove(start)
	progress(0.45, "files")
	_ = os.Remove(filepath.Join(dir, exeName))
	progress(0.65, "register")
	_ = registry.DeleteKey(registry.LOCAL_MACHINE, regKey)
	if removeData {
		progress(0.8, "data")
		if base := os.Getenv("LOCALAPPDATA"); base != "" {
			_ = os.RemoveAll(filepath.Join(base, appName))
		}
	}
	progress(1, "done")
	// Das laufende Deinstallationsprogramm und den (dann leeren) Ordner beim nächsten Neustart entfernen –
	// der übliche Windows-Weg (MoveFileEx, MOVEFILE_DELAY_UNTIL_REBOOT), ohne Hilfsprozesse.
	for _, p := range []string{filepath.Join(dir, uninstName), dir} {
		if pp, err := syscall.UTF16PtrFromString(p); err == nil {
			_, _, _ = procMoveFileEx.Call(uintptr(unsafe.Pointer(pp)), 0, 4)
		}
	}
	return nil
}

func launchApp(dir string) {
	// Über den Explorer starten: so läuft die App ohne Administratorrechte.
	target := filepath.Join(dir, exeName)
	if err := exec.Command("explorer.exe", target).Start(); err != nil {
		v, _ := syscall.UTF16PtrFromString("open")
		p, _ := syscall.UTF16PtrFromString(target)
		_, _, _ = procShellExec.Call(0, uintptr(unsafe.Pointer(v)), uintptr(unsafe.Pointer(p)), 0, 0, 1)
	}
}

func main() {
	uninstallMode := isUninstaller
	quiet := false
	for _, a := range os.Args[1:] {
		switch strings.ToLower(a) {
		case "/uninstall", "-uninstall", "--uninstall":
			uninstallMode = true
		case "/quiet", "/s", "-quiet":
			quiet = true
		}
	}
	if strings.HasPrefix(strings.ToLower(filepath.Base(os.Args[0])), "uninstall") {
		uninstallMode = true
	}
	tmpBase := filepath.Join(os.TempDir(), "VertexForgeSetup")
	_ = os.MkdirAll(tmpBase, 0o755)
	if lf, err := os.OpenFile(filepath.Join(tmpBase, "setup.log"), os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644); err == nil {
		log.SetOutput(lf)
		defer lf.Close()
	}

	if quiet {
		if uninstallMode {
			_ = uninstall(false, func(float64, string) {})
		} else {
			dir := existingDir()
			if dir == "" {
				dir = defaultDir()
			}
			if err := install(installOpts{Dir: dir, Desktop: true, StartMenu: true}, func(float64, string) {}); err != nil {
				log.Printf("install: %v", err)
				os.Exit(1)
			}
		}
		return
	}

	webview2.Frameless = true
	w := webview2.NewWithOptions(webview2.WebViewOptions{
		AutoFocus: true,
		DataPath:  filepath.Join(tmpBase, "WebView2"),
		WindowOptions: webview2.WindowOptions{
			Title: appName + " Setup", Width: 820, Height: 540, IconId: 1, Center: true,
		},
	})
	if w == nil {
		messageBox("Für das Setup wird die Microsoft Edge WebView2 Runtime benötigt (in Windows 10/11 meist vorinstalliert).\n\nSie wird jetzt im Browser geöffnet.", appName+" Setup", 0x30)
		v, _ := syscall.UTF16PtrFromString("open")
		u, _ := syscall.UTF16PtrFromString("https://go.microsoft.com/fwlink/p/?LinkId=2124703")
		_, _, _ = procShellExec.Call(0, uintptr(unsafe.Pointer(v)), uintptr(unsafe.Pointer(u)), 0, 0, 1)
		return
	}
	defer w.Destroy()
	w.SetSize(820, 540, webview2.HintFixed)
	type patched interface{ Chromium() *edge.Chromium }
	chromium := w.(patched).Chromium()
	hwnd := uintptr(w.Window())
	if st, err := chromium.GetSettings(); err == nil {
		_ = st.PutAreBrowserAcceleratorKeysEnabled(false)
		_ = st.PutIsZoomControlEnabled(false)
		_ = st.PutAreDefaultContextMenusEnabled(false)
		_ = st.PutIsStatusBarEnabled(false)
	}
	if c := chromium.GetController(); c != nil {
		if c2 := c.GetICoreWebView2Controller2(); c2 != nil {
			_ = c2.PutDefaultBackgroundColor(edge.COREWEBVIEW2_COLOR{A: 255, R: 0x14, G: 0x13, B: 0x16})
		}
	}
	m := [4]int32{1, 1, 1, 1}
	_, _, _ = procDwmExtend.Call(hwnd, uintptr(unsafe.Pointer(&m)))
	dark := int32(1)
	_, _, _ = procDwmSetAttr.Call(hwnd, 20, uintptr(unsafe.Pointer(&dark)), 4)
	corner := int32(2) // DWMWCP_ROUND (Windows 11)
	_, _, _ = procDwmSetAttr.Call(hwnd, 33, uintptr(unsafe.Pointer(&corner)), 4)
	_, _, _ = procSetWinPos.Call(hwnd, 0, 0, 0, 0, 0, 0x0001|0x0002|0x0004|0x0020)

	eval := func(js string) { w.Dispatch(func() { w.Eval(js) }) }
	progress := func(p float64, step string) {
		b, _ := json.Marshal(step)
		eval(fmt.Sprintf("window.onProgress && onProgress(%f,%s)", p, string(b)))
	}

	_ = w.Bind("setupInfo", func() map[string]interface{} {
		ex := existingDir()
		dir := ex
		if dir == "" {
			dir = defaultDir()
		}
		return map[string]interface{}{
			"mode": map[bool]string{true: "uninstall", false: "install"}[uninstallMode],
			"lang": map[bool]string{true: storedLang(), false: "en"}[uninstallMode],
			"version": appVersion, "dir": dir, "existing": ex != "",
			"sizeMB": float64(payloadSize()) / 1e6, "logo": "data:image/png;base64," + base64.StdEncoding.EncodeToString(logoPNG),
		}
	})
	_ = w.Bind("setupWin", func(a string) bool {
		switch a {
		case "drag":
			w.Dispatch(func() {
				_, _, _ = procReleaseCap.Call()
				_, _, _ = procSendMsg.Call(hwnd, 0x00A1, 2, 0)
			})
		case "min":
			w.Dispatch(func() { _, _, _ = procShowWindow.Call(hwnd, 6) })
		case "close":
			_, _, _ = procPostMsg.Call(hwnd, 0x0010, 0, 0)
		}
		return true
	})
	_ = w.Bind("setupBrowse", func(title string) bool {
		w.Dispatch(func() {
			p := winutil.BrowseFolder(hwnd, title)
			if p != "" && !strings.EqualFold(filepath.Base(p), appName) {
				p = filepath.Join(p, appName)
			}
			b, _ := json.Marshal(p)
			w.Eval("window.onBrowse && onBrowse(" + string(b) + ")")
		})
		return true
	})
	_ = w.Bind("setupRunning", func() bool { return appRunning() })
	_ = w.Bind("setupInstall", func(o installOpts) bool {
		go func() {
			if appRunning() {
				eval(`window.onError && onError("running")`)
				return
			}
			if err := install(o, progress); err != nil {
				b, _ := json.Marshal(err.Error())
				eval("window.onError && onError(" + string(b) + ")")
				return
			}
			eval("window.onDone && onDone()")
		}()
		return true
	})
	_ = w.Bind("setupUninstall", func(removeData bool) bool {
		go func() {
			if appRunning() {
				eval(`window.onError && onError("running")`)
				return
			}
			_ = uninstall(removeData, progress)
			eval("window.onDone && onDone()")
		}()
		return true
	})
	_ = w.Bind("setupLaunch", func(dir string) bool { launchApp(dir); return true })
	_ = w.Bind("setupOpenURL", func(u string) bool {
		if strings.HasPrefix(u, "https://") {
			v, _ := syscall.UTF16PtrFromString("open")
			p, _ := syscall.UTF16PtrFromString(u)
			_, _, _ = procShellExec.Call(0, uintptr(unsafe.Pointer(v)), uintptr(unsafe.Pointer(p)), 0, 0, 1)
		}
		return true
	})
	w.SetHtml(uiHTML)
	w.Run()
}
