//go:build linux

package main

/*
#cgo pkg-config: gtk+-3.0 webkit2gtk-4.1
#include <gtk/gtk.h>
#include <webkit2/webkit2.h>
#include <stdlib.h>

static GtkWindow *vf_win(void *w) { return GTK_WINDOW(w); }

static WebKitWebView *vf_view(void *w) {
	GtkWidget *c = gtk_bin_get_child(GTK_BIN(w));
	if (c && WEBKIT_IS_WEB_VIEW(c)) return WEBKIT_WEB_VIEW(c);
	return NULL;
}

// Native Dateiauswahl (nutzt im Sandbox-/Flatpak-Fall automatisch das Portal).
// mode: 0 = öffnen (Projekt), 1 = öffnen (alle Dateien), 2 = speichern, 3 = Ordner
static char *vf_choose(void *parent, const char *title, int mode, const char *name) {
	GtkFileChooserAction act = GTK_FILE_CHOOSER_ACTION_OPEN;
	const char *ok = "_Open";
	if (mode == 2) { act = GTK_FILE_CHOOSER_ACTION_SAVE; ok = "_Save"; }
	if (mode == 3) { act = GTK_FILE_CHOOSER_ACTION_SELECT_FOLDER; ok = "_Select"; }
	GtkFileChooserNative *d = gtk_file_chooser_native_new(title, parent ? GTK_WINDOW(parent) : NULL, act, ok, "_Cancel");
	GtkFileChooser *fc = GTK_FILE_CHOOSER(d);
	gtk_native_dialog_set_modal(GTK_NATIVE_DIALOG(d), TRUE);
	if (mode == 0) {
		GtkFileFilter *f = gtk_file_filter_new();
		gtk_file_filter_set_name(f, "VertexForge (*.vforge, *.json)");
		gtk_file_filter_add_pattern(f, "*.vforge");
		gtk_file_filter_add_pattern(f, "*.json");
		gtk_file_chooser_add_filter(fc, f);
		GtkFileFilter *a = gtk_file_filter_new();
		gtk_file_filter_set_name(a, "*");
		gtk_file_filter_add_pattern(a, "*");
		gtk_file_chooser_add_filter(fc, a);
	}
	if (mode == 2) {
		gtk_file_chooser_set_do_overwrite_confirmation(fc, TRUE);
		if (name && *name) gtk_file_chooser_set_current_name(fc, name);
	}
	char *res = NULL;
	if (gtk_native_dialog_run(GTK_NATIVE_DIALOG(d)) == GTK_RESPONSE_ACCEPT) {
		res = gtk_file_chooser_get_filename(fc);
	}
	g_object_unref(d);
	return res;
}

static void vf_message(const char *title, const char *text) {
	if (!gtk_init_check(NULL, NULL)) return;
	GtkWidget *d = gtk_message_dialog_new(NULL, 0, GTK_MESSAGE_ERROR, GTK_BUTTONS_OK, "%s", text);
	gtk_window_set_title(GTK_WINDOW(d), title);
	gtk_dialog_run(GTK_DIALOG(d));
	gtk_widget_destroy(d);
	while (gtk_events_pending()) gtk_main_iteration();
}

static int vf_is_fullscreen(void *w) {
	GdkWindow *g = gtk_widget_get_window(GTK_WIDGET(w));
	return g && (gdk_window_get_state(g) & GDK_WINDOW_STATE_FULLSCREEN) ? 1 : 0;
}

static void vf_fullscreen(void *w, int on) {
	if (on) gtk_window_fullscreen(vf_win(w)); else gtk_window_unfullscreen(vf_win(w));
}

static void vf_zoom(void *w, double z) {
	WebKitWebView *v = vf_view(w);
	if (v) webkit_web_view_set_zoom_level(v, z);
}

// Programmname vor dem Fenster setzen: bestimmt WM_CLASS (Dock-Symbol der .desktop-Datei)
// und den Speicherordner des WebViews (~/.local/share/vertexforge-studio).
static void vf_preinit(void) {
	g_set_prgname("vertexforge-studio");
	g_set_application_name("VertexForge Studio");
}

static void vf_setup(void *w, const unsigned char *png, int len) {
	GtkWindow *win = vf_win(w);
	if (png && len > 0) {
		GInputStream *s = g_memory_input_stream_new_from_data(png, len, NULL);
		GdkPixbuf *pb = gdk_pixbuf_new_from_stream(s, NULL, NULL);
		if (pb) { gtk_window_set_icon(win, pb); g_object_unref(pb); }
		g_object_unref(s);
	}
	WebKitWebView *v = vf_view(w);
	if (v) {
		WebKitSettings *st = webkit_web_view_get_settings(v);
		webkit_settings_set_enable_back_forward_navigation_gestures(st, FALSE);
		webkit_settings_set_javascript_can_access_clipboard(st, TRUE);
		webkit_settings_set_enable_developer_extras(st, getenv("VF_DEBUG") != NULL);
		webkit_settings_set_enable_write_console_messages_to_stdout(st, getenv("VF_DEBUG") != NULL);
	}
}
*/
import "C"

import (
	_ "embed"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"unsafe"

	webview "github.com/webview/webview_go"
)

//go:embed winres/icon_256.png
var iconPNG []byte

func platformName() string { return "linux" }

func dataBase() string {
	d := os.Getenv("XDG_DATA_HOME")
	if d == "" {
		h, _ := os.UserHomeDir()
		d = filepath.Join(h, ".local", "share")
	}
	return filepath.Join(d, "vertexforge-studio")
}

func nativeLang() string { return "" }

func webviewHint() string {
	return "Bitte WebKitGTK installieren / Please install WebKitGTK:\n  Ubuntu/Debian/Mint: sudo apt install libwebkit2gtk-4.1-0\n  Fedora: sudo dnf install webkit2gtk4.1\n  Arch: sudo pacman -S webkit2gtk-4.1"
}

func nativePreinit() { C.vf_preinit() }

func nativeSetup(w webview.WebView) {
	C.vf_setup(w.Window(), (*C.uchar)(unsafe.Pointer(&iconPNG[0])), C.int(len(iconPNG)))
}

func choose(w webview.WebView, title string, mode int, name string) string {
	ct, cn := C.CString(title), C.CString(name)
	defer C.free(unsafe.Pointer(ct))
	defer C.free(unsafe.Pointer(cn))
	r := C.vf_choose(w.Window(), ct, C.int(mode), cn)
	if r == nil {
		return ""
	}
	defer C.g_free(C.gpointer(r))
	return C.GoString(r)
}

// chooseAsync wird aus einer Goroutine aufgerufen: der GTK-Dialog selbst läuft im Hauptthread.
func chooseAsync(w webview.WebView, title string, mode int, name string) string {
	ch := make(chan string, 1)
	w.Dispatch(func() { ch <- choose(w, title, mode, name) })
	return <-ch
}

func nativeOpenFile(w webview.WebView, title string, project bool) string {
	if project {
		return chooseAsync(w, title, 0, "")
	}
	return chooseAsync(w, title, 1, "")
}
func nativeSaveFile(w webview.WebView, title, name string) string {
	return chooseAsync(w, title, 2, name)
}
func nativePickFolder(w webview.WebView, title string) string { return chooseAsync(w, title, 3, "") }

func nativeIsFullscreen(w webview.WebView) bool { return C.vf_is_fullscreen(w.Window()) == 1 }

func nativeMessage(title, text string) {
	ct, cx := C.CString(title), C.CString(text)
	defer C.free(unsafe.Pointer(ct))
	defer C.free(unsafe.Pointer(cx))
	C.vf_message(ct, cx)
}

func nativeSetFullscreen(w webview.WebView, on bool) {
	v := 0
	if on {
		v = 1
	}
	C.vf_fullscreen(w.Window(), C.int(v))
}

func nativeSetZoom(w webview.WebView, z float64) { C.vf_zoom(w.Window(), C.double(z)) }

func nativeOpen(target string) error { return exec.Command("xdg-open", target).Start() }

// nativeReveal zeigt die Datei im Dateimanager markiert an (Freedesktop-Schnittstelle),
// sonst wird einfach der Ordner geöffnet.
func nativeReveal(p string) error {
	if st, err := os.Stat(p); err == nil && st.IsDir() {
		return nativeOpen(p)
	}
	if _, err := os.Stat(p); err != nil {
		return err
	}
	uri := (&url.URL{Scheme: "file", Path: p}).String()
	cmd := exec.Command("dbus-send", "--session", "--print-reply", "--dest=org.freedesktop.FileManager1",
		"/org/freedesktop/FileManager1", "org.freedesktop.FileManager1.ShowItems", "array:string:"+uri, "string:")
	if err := cmd.Run(); err == nil {
		return nil
	}
	return nativeOpen(filepath.Dir(p))
}
