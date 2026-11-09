// Gemeinsame Teile aller Desktop-Hüllen (Windows, macOS, Linux).
package main

import (
	"embed"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

const (
	appName    = "VertexForge Studio"
	appVersion = "2.9.0"
)

//go:embed app
var appFiles embed.FS

// ---- Team-Ordner: gemeinsamer Projektordner (OneDrive, Dropbox, Netzlaufwerk …) ----
// Alle Zugriffe bleiben strikt innerhalb des gewählten Ordners.
func teamPath(root, rel string) (string, error) {
	if root == "" || rel == "" {
		return "", errors.New("empty path")
	}
	clean := filepath.Clean(filepath.FromSlash(rel))
	if filepath.IsAbs(clean) || clean == "." || strings.HasPrefix(clean, "..") || strings.ContainsAny(clean, ":*?\"<>|") {
		return "", errors.New("invalid path")
	}
	return filepath.Join(root, clean), nil
}

type teamEntry struct {
	Rel   string `json:"rel"`
	Mtime int64  `json:"mtime"`
	Size  int64  `json:"size"`
}

func teamScan(root string) ([]teamEntry, error) {
	out := []teamEntry{}
	st, err := os.Stat(root)
	if err != nil || !st.IsDir() {
		return out, errors.New("folder not reachable")
	}
	err = filepath.WalkDir(root, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			if p != root && strings.Count(strings.TrimPrefix(p, root), string(os.PathSeparator)) > 3 {
				return filepath.SkipDir
			}
			return nil
		}
		name := d.Name()
		if strings.HasSuffix(name, ".tmp") || strings.HasPrefix(name, "~") || len(out) >= 50000 {
			return nil
		}
		info, err := d.Info()
		if err != nil {
			return nil
		}
		rel, _ := filepath.Rel(root, p)
		out = append(out, teamEntry{Rel: filepath.ToSlash(rel), Mtime: info.ModTime().UnixMilli(), Size: info.Size()})
		return nil
	})
	return out, err
}

func teamWrite(root, rel, content string) error {
	p, err := teamPath(root, rel)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		return err
	}
	tmp := p + ".tmp"
	if err := os.WriteFile(tmp, []byte(content), 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, p)
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
