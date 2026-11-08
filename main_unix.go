//go:build darwin || linux

// VertexForge Studio – Desktop-Hülle für macOS und Linux
// ---------------------------------------------------------------------------
// Gleiche Brücke wie unter Windows, aber mit dem System-WebView
// (WKWebView auf macOS, WebKitGTK auf Linux) und der normalen Fensterleiste.
//
// Die App wird über einen kleinen Server nur auf 127.0.0.1 ausgeliefert –
// immer unter derselben Adresse, damit der Browser-Speicher (IndexedDB)
// zwischen den Starts erhalten bleibt. Verknüpfte Bilder/Videos von der
// Festplatte sind nur mit einem zufälligen Schlüssel pro Start erreichbar.
package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"runtime/debug"
	"strings"
	"sync"
	"time"

	webview "github.com/webview/webview_go"
)

// Feste Adresse = fester Speicherort der Projekte im WebView. Nicht ändern!
const appPortFirst = 47821

type pingInfo struct {
	App     string `json:"app"`
	Version string `json:"version"`
	Token   string `json:"token"`
}

func randToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// startServer liefert die eingebettete App aus. Läuft schon ein VertexForge-Fenster,
// wird dessen Server mitbenutzt (gleiche Adresse = gleiche Projekte).
func startServer() (base, token string, err error) {
	token = randToken()
	for port := appPortFirst; port < appPortFirst+10; port++ {
		addr := fmt.Sprintf("127.0.0.1:%d", port)
		ln, lerr := net.Listen("tcp", addr)
		if lerr != nil {
			if pi, ok := pingOther(addr); ok {
				log.Printf("benutze laufende Instanz %s (v%s)", addr, pi.Version)
				return "http://" + addr, pi.Token, nil
			}
			continue
		}
		if port != appPortFirst {
			log.Printf("WARNUNG: Port %d belegt – weiche auf %d aus (eigener Speicherbereich)", appPortFirst, port)
		}
		go func() { _ = http.Serve(ln, appHandler(addr, token)) }()
		return "http://" + addr, token, nil
	}
	return "", "", fmt.Errorf("kein freier Port ab %d", appPortFirst)
}

func pingOther(addr string) (pingInfo, bool) {
	var pi pingInfo
	c := http.Client{Timeout: 800 * time.Millisecond}
	r, err := c.Get("http://" + addr + "/vf-ping")
	if err != nil {
		return pi, false
	}
	defer r.Body.Close()
	b, _ := io.ReadAll(io.LimitReader(r.Body, 4096))
	if json.Unmarshal(b, &pi) != nil || pi.App != appName {
		return pi, false
	}
	return pi, true
}

func appHandler(addr, token string) http.Handler {
	sub, _ := fs.Sub(appFiles, "app")
	files := http.FileServer(http.FS(sub))
	fsPrefix := "/fs/" + token + "/"
	localhost := strings.Replace(addr, "127.0.0.1", "localhost", 1)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Schutz gegen DNS-Rebinding: nur Anfragen direkt an diese Adresse.
		if r.Host != addr && r.Host != localhost {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		w.Header().Set("X-Content-Type-Options", "nosniff")
		switch {
		case r.URL.Path == "/vf-log":
			if m := r.URL.Query().Get("m"); m != "" && len(m) < 500 {
				log.Printf("app: %s", m)
			}
			w.WriteHeader(http.StatusNoContent)
		case r.URL.Path == "/vf-ping":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(pingInfo{App: appName, Version: appVersion, Token: token})
		case strings.HasPrefix(r.URL.Path, fsPrefix):
			p := filepath.Clean("/" + strings.TrimPrefix(r.URL.Path, fsPrefix))
			st, err := os.Stat(p)
			if err != nil || st.IsDir() {
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Cache-Control", "no-cache")
			http.ServeFile(w, r, p)
		case strings.HasPrefix(r.URL.Path, "/fs/"):
			http.NotFound(w, r)
		default:
			w.Header().Set("Cache-Control", "no-cache")
			files.ServeHTTP(w, r)
		}
	})
}

func main() {
	runtime.LockOSThread()
	base := dataBase()
	_ = os.MkdirAll(base, 0o755)
	if f, err := os.OpenFile(filepath.Join(base, "vertexforge.log"), os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644); err == nil {
		log.SetOutput(f)
		defer f.Close()
	}
	log.Printf("%s %s (%s/%s)", appName, appVersion, runtime.GOOS, runtime.GOARCH)
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Absturz: %v\n%s", r, debug.Stack())
			nativeMessage(appName, fmt.Sprintf("Unerwarteter Fehler / Unexpected error:\n%v\n\nLog: %s", r, filepath.Join(base, "vertexforge.log")))
		}
	}()

	srv, token, err := startServer()
	if err != nil {
		log.Print(err)
		nativeMessage(appName, "VertexForge Studio konnte nicht starten / could not start:\n"+err.Error())
		return
	}
	log.Printf("App: %s", srv)

	nativePreinit()
	w := webview.New(os.Getenv("VF_DEBUG") == "1")
	if w == nil {
		nativeMessage(appName, "Das Web-Fenster konnte nicht erstellt werden.\nThe web view could not be created.\n\n"+webviewHint())
		return
	}
	defer w.Destroy()
	w.SetTitle(appName)
	w.SetSize(1440, 900, webview.HintNone)
	w.SetSize(960, 600, webview.HintMin)
	nativeSetup(w)

	w.Init(fmt.Sprintf("window.__vfFileBase=%q;window.__vfPlatform=%q;", srv+"/fs/"+token, platformName()))

	// ---- Schließen: der App Zeit geben, alles zu sichern ----
	var mu sync.Mutex
	closing, acked, allow := false, false, false
	quit := func() {
		mu.Lock()
		allow = true
		mu.Unlock()
		w.Terminate()
	}
	webview.CloseHook = func() bool {
		mu.Lock()
		defer mu.Unlock()
		if allow {
			return false
		}
		if closing {
			return true
		}
		closing, acked = true, false
		w.Eval("window.__vfBeforeClose ? window.__vfBeforeClose() : vfCloseNow()")
		go func() {
			time.Sleep(2500 * time.Millisecond)
			mu.Lock()
			stuck := closing && !acked
			mu.Unlock()
			if stuck {
				w.Dispatch(quit)
			}
		}()
		return true
	}
	_ = w.Bind("vfCloseAck", func() { mu.Lock(); acked = true; mu.Unlock() })
	_ = w.Bind("vfCloseCancel", func() { mu.Lock(); closing = false; mu.Unlock() })
	_ = w.Bind("vfCloseNow", func() { w.Dispatch(quit) })

	// ---- Systembrücke ----
	_ = w.Bind("vfInfo", func() map[string]string {
		return map[string]string{"version": appVersion, "platform": platformName(), "dataDir": base, "lang": systemLang(), "user": os.Getenv("USER")}
	})
	_ = w.Bind("vfSetTitle", func(t string) { w.SetTitle(t) })
	_ = w.Bind("vfSetZoom", func(z float64) float64 {
		if z < 0.5 {
			z = 0.5
		}
		if z > 2.5 {
			z = 2.5
		}
		nativeSetZoom(w, z)
		return z
	})
	// Echter Zustand vom Fenster (auch wenn per System-Taste gewechselt wurde).
	_ = w.Bind("vfFullscreen", func() bool {
		on := !nativeIsFullscreen(w)
		nativeSetFullscreen(w, on)
		return on
	})

	resolve := func(id int, v interface{}, err error) {
		b, _ := json.Marshal(v)
		e := "null"
		if err != nil {
			eb, _ := json.Marshal(err.Error())
			e = string(eb)
		}
		w.Eval(fmt.Sprintf("window.__vfResolve && window.__vfResolve(%d,%s,%s)", id, string(b), e))
	}
	// Dialoge laufen nebenläufig (die Oberfläche bleibt flüssig) und melden
	// ihr Ergebnis über window.__vfResolve(id, result, error) zurück.
	async := func(id int, f func() (interface{}, error)) {
		go func() {
			v, err := f()
			w.Dispatch(func() { resolve(id, v, err) })
		}()
	}
	_ = w.Bind("vfSaveFileAs", func(id int, name, content string) {
		async(id, func() (interface{}, error) {
			p := nativeSaveFile(w, "Projekt speichern / Save project", name)
			if p == "" {
				return "", nil
			}
			if filepath.Ext(p) == "" {
				p += ".vforge"
			}
			return p, writeAtomic(p, content)
		})
	})
	_ = w.Bind("vfWriteFile", func(path, content string) error { return writeAtomic(path, content) })
	_ = w.Bind("vfOpenFile", func(id int) {
		async(id, func() (interface{}, error) {
			p := nativeOpenFile(w, "Projekt öffnen / Open project", true)
			if p == "" {
				return map[string]string{}, nil
			}
			b, err := os.ReadFile(p)
			return map[string]string{"path": p, "content": string(b)}, err
		})
	})
	_ = w.Bind("vfPickPath", func(id int) {
		async(id, func() (interface{}, error) { return nativeOpenFile(w, "Datei verknüpfen / Link file", false), nil })
	})
	_ = w.Bind("vfTeamPick", func(id int) {
		async(id, func() (interface{}, error) { return nativePickFolder(w, "Team-Ordner / Team folder"), nil })
	})
	_ = w.Bind("vfTeamScan", func(root string) ([]teamEntry, error) { return teamScan(root) })
	_ = w.Bind("vfTeamRead", func(root string, rels []string) map[string]string {
		out := map[string]string{}
		for _, r := range rels {
			if p, err := teamPath(root, r); err == nil {
				if b, err := os.ReadFile(p); err == nil {
					out[r] = string(b)
				}
			}
		}
		return out
	})
	_ = w.Bind("vfTeamWrite", func(root, rel, content string) error { return teamWrite(root, rel, content) })
	_ = w.Bind("vfTeamDelete", func(root, rel string) error {
		p, err := teamPath(root, rel)
		if err != nil {
			return err
		}
		if err := os.Remove(p); err != nil && !os.IsNotExist(err) {
			return err
		}
		return nil
	})
	_ = w.Bind("vfTeamMkdir", func(parent, name string) (string, error) {
		p, err := teamPath(parent, name)
		if err != nil {
			return "", err
		}
		return p, os.MkdirAll(p, 0o755)
	})
	_ = w.Bind("vfOpenPath", func(p string) error {
		if _, err := os.Stat(p); err != nil {
			return err
		}
		return nativeOpen(p)
	})
	_ = w.Bind("vfRevealPath", func(p string) error { return nativeReveal(p) })
	_ = w.Bind("vfOpenURL", func(u string) error {
		if strings.HasPrefix(u, "https://") || strings.HasPrefix(u, "http://") {
			return nativeOpen(u)
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

	w.Navigate(srv + "/")
	w.Run()
	log.Print("beendet")
}

// systemLang liefert den zweistelligen Sprachcode des Systems (z. B. "de").
func systemLang() string {
	for _, k := range []string{"LC_ALL", "LC_MESSAGES", "LANG", "LANGUAGE"} {
		if v := strings.ToLower(os.Getenv(k)); len(v) >= 2 && v != "c" && v != "posix" && !strings.HasPrefix(v, "c.") {
			return v[:2]
		}
	}
	return nativeLang()
}
