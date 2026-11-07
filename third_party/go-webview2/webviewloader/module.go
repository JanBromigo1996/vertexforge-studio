// Package webviewloader – VertexForge-Variante.
//
// Das Original bettet Microsofts WebView2Loader.dll in die .exe ein und lädt sie bei Bedarf
// direkt aus dem Arbeitsspeicher (eigener PE-Loader). Dieses Muster ähnelt Schadsoftware und
// löst Fehlalarme in Virenscannern aus. Diese Variante macht deshalb nur zwei offene Dinge:
//
//  1. WebView2Loader.dll ganz normal von der Festplatte laden (liegt neben der .exe bzw. wird
//     über SetDLLPath angegeben – das Setup legt sie dafür in seinen Temp-Ordner).
//  2. Falls sie fehlt: die installierte WebView2-Runtime selbst finden und deren offizielle
//     EmbeddedBrowserWebView.dll laden (so wie es auch WebView2Loader.dll intern tut).
package webviewloader

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"unsafe"

	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

const runtimeClientID = `{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}`

var (
	dllPath  = "WebView2Loader.dll"
	initOnce sync.Once
	native   *windows.LazyDLL
)

// SetDLLPath legt fest, von welchem Pfad WebView2Loader.dll geladen wird (vor der ersten Nutzung aufrufen).
func SetDLLPath(p string) { dllPath = p }

func loader() (*windows.LazyDLL, error) {
	initOnce.Do(func() {
		p := dllPath
		if !filepath.IsAbs(p) {
			if exe, err := os.Executable(); err == nil {
				p = filepath.Join(filepath.Dir(exe), p)
			}
		}
		native = windows.NewLazyDLL(p)
	})
	if err := native.Load(); err != nil {
		return nil, err
	}
	return native, nil
}

// CompareBrowserVersions vergleicht zwei Versionsnummern (-1, 0, 1).
func CompareBrowserVersions(v1 string, v2 string) (int, error) {
	a, b := parseVer(v1), parseVer(v2)
	for i := 0; i < 4; i++ {
		if a[i] != b[i] {
			if a[i] < b[i] {
				return -1, nil
			}
			return 1, nil
		}
	}
	return 0, nil
}

func parseVer(v string) [4]int {
	var out [4]int
	f := strings.Fields(v)
	if len(f) > 0 {
		v = f[0]
	}
	for i, p := range strings.SplitN(v, ".", 4) {
		out[i], _ = strconv.Atoi(p)
	}
	return out
}

// GetInstalledVersion gibt die installierte WebView2-Runtime-Version zurück ("" wenn keine).
func GetInstalledVersion() (string, error) {
	if dir, ver := findRuntime(); dir != "" {
		return ver, nil
	}
	return "", nil
}

// findRuntime sucht die installierte Evergreen-WebView2-Runtime (Registry, dann Standardordner).
func findRuntime() (dir, version string) {
	type cand struct{ root registry.Key; key string; base string }
	pf86 := os.Getenv("ProgramFiles(x86)")
	if pf86 == "" {
		pf86 = `C:\Program Files (x86)`
	}
	local := os.Getenv("LOCALAPPDATA")
	cands := []cand{
		{registry.LOCAL_MACHINE, `SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\` + runtimeClientID, filepath.Join(pf86, `Microsoft\EdgeWebView\Application`)},
		{registry.LOCAL_MACHINE, `SOFTWARE\Microsoft\EdgeUpdate\Clients\` + runtimeClientID, filepath.Join(pf86, `Microsoft\EdgeWebView\Application`)},
		{registry.CURRENT_USER, `Software\Microsoft\EdgeUpdate\Clients\` + runtimeClientID, filepath.Join(local, `Microsoft\EdgeWebView\Application`)},
	}
	for _, c := range cands {
		k, err := registry.OpenKey(c.root, c.key, registry.QUERY_VALUE|registry.WOW64_64KEY)
		if err != nil {
			continue
		}
		pv, _, _ := k.GetStringValue("pv")
		loc, _, _ := k.GetStringValue("location")
		k.Close()
		if pv == "" || pv == "0.0.0.0" {
			continue
		}
		for _, base := range []string{loc, c.base} {
			if base == "" {
				continue
			}
			d := filepath.Join(base, pv)
			if fileExists(clientDLL(d)) {
				return d, pv
			}
		}
	}
	// Fallback: höchste Version im Standardordner
	for _, base := range []string{filepath.Join(pf86, `Microsoft\EdgeWebView\Application`), filepath.Join(local, `Microsoft\EdgeWebView\Application`)} {
		m, _ := filepath.Glob(filepath.Join(base, "*", "EBWebView"))
		sort.Slice(m, func(i, j int) bool {
			r, _ := CompareBrowserVersions(filepath.Base(filepath.Dir(m[i])), filepath.Base(filepath.Dir(m[j])))
			return r > 0
		})
		for _, e := range m {
			d := filepath.Dir(e)
			if fileExists(clientDLL(d)) {
				return d, filepath.Base(d)
			}
		}
	}
	return "", ""
}

func clientDLL(runtimeDir string) string {
	arch := "x64"
	if unsafe.Sizeof(uintptr(0)) == 4 {
		arch = "x86"
	}
	return filepath.Join(runtimeDir, "EBWebView", arch, "EmbeddedBrowserWebView.dll")
}

func fileExists(p string) bool {
	st, err := os.Stat(p)
	return err == nil && !st.IsDir()
}

// CreateCoreWebView2EnvironmentWithOptions startet die WebView2-Umgebung.
func CreateCoreWebView2EnvironmentWithOptions(browserExecutableFolder, userDataFolder *uint16, environmentOptions uintptr, environmentCompletedHandle uintptr) (uintptr, error) {
	if dll, err := loader(); err == nil {
		if proc := dll.NewProc("CreateCoreWebView2EnvironmentWithOptions"); proc.Find() == nil {
			res, _, _ := proc.Call(
				uintptr(unsafe.Pointer(browserExecutableFolder)),
				uintptr(unsafe.Pointer(userDataFolder)),
				environmentOptions,
				environmentCompletedHandle,
			)
			return res, nil
		}
	}
	// Ohne WebView2Loader.dll: die offizielle Runtime-DLL direkt verwenden.
	dir := ""
	runtimeType := uintptr(0) // installierte Runtime
	if browserExecutableFolder != nil {
		dir = windows.UTF16PtrToString(browserExecutableFolder)
		runtimeType = 1 // fester Ordner
	} else {
		dir, _ = findRuntime()
	}
	if dir == "" {
		return 0, fmt.Errorf("WebView2 runtime not found")
	}
	client := windows.NewLazyDLL(clientDLL(dir))
	proc := client.NewProc("CreateWebViewEnvironmentWithOptionsInternal")
	if err := proc.Find(); err != nil {
		return 0, fmt.Errorf("WebView2 runtime: %w", err)
	}
	res, _, _ := proc.Call(1, runtimeType, uintptr(unsafe.Pointer(userDataFolder)), environmentOptions, environmentCompletedHandle)
	return res, nil
}
