//go:build darwin

package main

/*
#cgo CFLAGS: -x objective-c -fobjc-arc
#cgo LDFLAGS: -framework Cocoa -framework WebKit
#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

static NSWindow *vf_win(void *w) { return (__bridge NSWindow *)w; }

static int vf_is_fullscreen(void *w) {
	return ([vf_win(w) styleMask] & NSWindowStyleMaskFullScreen) ? 1 : 0;
}

static void vf_toggle_fullscreen(void *w) {
	NSWindow *win = vf_win(w);
	[win setCollectionBehavior:[win collectionBehavior] | NSWindowCollectionBehaviorFullScreenPrimary];
	[win toggleFullScreen:nil];
}

static void vf_zoom(void *w, double z) {
	NSView *v = [vf_win(w) contentView];
	if ([v isKindOfClass:[WKWebView class]] && [v respondsToSelector:@selector(setPageZoom:)]) {
		[(WKWebView *)v setPageZoom:z];
	}
}

static NSMenuItem *vf_item(NSMenu *m, NSString *title, SEL action, NSString *key, NSEventModifierFlags mods) {
	NSMenuItem *it = [m addItemWithTitle:title action:action keyEquivalent:key];
	[it setKeyEquivalentModifierMask:mods];
	return it;
}

// Hauptmenü: ohne Bearbeiten-Menü funktionieren Cmd+C/V/X/A im WebView nicht.
// "Beenden" geht über performClose:, damit die App vorher alles sichern kann.
static void vf_menu(int de) {
	NSMenu *bar = [[NSMenu alloc] init];
	NSEventModifierFlags cmd = NSEventModifierFlagCommand;

	NSMenuItem *appItem = [bar addItemWithTitle:@"" action:nil keyEquivalent:@""];
	NSMenu *app = [[NSMenu alloc] initWithTitle:@"VertexForge Studio"];
	vf_item(app, de ? @"VertexForge Studio ausblenden" : @"Hide VertexForge Studio", @selector(hide:), @"h", cmd);
	vf_item(app, de ? @"Andere ausblenden" : @"Hide Others", @selector(hideOtherApplications:), @"h", cmd | NSEventModifierFlagOption);
	[app addItem:[NSMenuItem separatorItem]];
	vf_item(app, de ? @"VertexForge Studio beenden" : @"Quit VertexForge Studio", @selector(performClose:), @"q", cmd);
	[appItem setSubmenu:app];

	NSMenuItem *editItem = [bar addItemWithTitle:@"" action:nil keyEquivalent:@""];
	NSMenu *edit = [[NSMenu alloc] initWithTitle:de ? @"Bearbeiten" : @"Edit"];
	vf_item(edit, de ? @"Ausschneiden" : @"Cut", @selector(cut:), @"x", cmd);
	vf_item(edit, de ? @"Kopieren" : @"Copy", @selector(copy:), @"c", cmd);
	vf_item(edit, de ? @"Einsetzen" : @"Paste", @selector(paste:), @"v", cmd);
	vf_item(edit, de ? @"Alles auswählen" : @"Select All", @selector(selectAll:), @"a", cmd);
	[editItem setSubmenu:edit];

	NSMenuItem *winItem = [bar addItemWithTitle:@"" action:nil keyEquivalent:@""];
	NSMenu *win = [[NSMenu alloc] initWithTitle:de ? @"Fenster" : @"Window"];
	vf_item(win, de ? @"Im Dock ablegen" : @"Minimize", @selector(performMiniaturize:), @"m", cmd);
	vf_item(win, de ? @"Zoomen" : @"Zoom", @selector(performZoom:), @"", 0);
	vf_item(win, de ? @"Schließen" : @"Close", @selector(performClose:), @"w", cmd);
	[winItem setSubmenu:win];

	[NSApp setMainMenu:bar];
	[NSApp setWindowsMenu:win];
}

static void vf_setup(void *w, int de) {
	vf_menu(de);
	NSWindow *win = vf_win(w);
	[win setCollectionBehavior:[win collectionBehavior] | NSWindowCollectionBehaviorFullScreenPrimary];
	[win setTabbingMode:NSWindowTabbingModeDisallowed];
	[win center];
}
*/
import "C"

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	webview "github.com/webview/webview_go"
)

func platformName() string { return "macos" }

func dataBase() string {
	h, _ := os.UserHomeDir()
	return filepath.Join(h, "Library", "Application Support", "VertexForge Studio")
}

func nativeLang() string {
	out, err := exec.Command("defaults", "read", "-g", "AppleLocale").Output()
	if err != nil || len(out) < 2 {
		return ""
	}
	return strings.ToLower(string(out[:2]))
}

func webviewHint() string {
	return "macOS 11 (Big Sur) oder neuer wird benötigt / macOS 11 or newer is required."
}

func nativePreinit() {}

func nativeSetup(w webview.WebView) {
	de := 0
	if systemLang() == "de" {
		de = 1
	}
	C.vf_setup(w.Window(), C.int(de))
}

// asQuote macht aus einem Go-String ein sicheres AppleScript-Literal.
func asQuote(s string) string {
	return `"` + strings.NewReplacer(`\`, `\\`, `"`, `\"`).Replace(s) + `"`
}

// osa führt AppleScript aus. Abbrechen im Dialog liefert "".
func osa(script string) string {
	out, err := exec.Command("osascript", "-e", script).Output()
	if err != nil {
		return ""
	}
	return strings.TrimRight(string(out), "\r\n")
}

func nativeOpenFile(w webview.WebView, title string, project bool) string {
	if project {
		cmd := exec.Command("osascript", "-e", `activate
POSIX path of (choose file with prompt `+asQuote(title)+` of type {"vforge", "json", "public.json"})`)
		out, err := cmd.Output()
		if err == nil {
			return strings.TrimRight(string(out), "\r\n")
		}
		if ee, ok := err.(*exec.ExitError); ok && strings.Contains(string(ee.Stderr), "-128") {
			return "" // abgebrochen
		}
	}
	return osa("activate\nPOSIX path of (choose file with prompt " + asQuote(title) + ")")
}

func nativeSaveFile(w webview.WebView, title, name string) string {
	return osa("activate\nPOSIX path of (choose file name with prompt " + asQuote(title) + " default name " + asQuote(name) + ")")
}

func nativePickFolder(w webview.WebView, title string) string {
	p := osa("activate\nPOSIX path of (choose folder with prompt " + asQuote(title) + ")")
	if len(p) > 1 {
		p = strings.TrimRight(p, "/")
	}
	return p
}

func nativeMessage(title, text string) {
	_ = exec.Command("osascript", "-e", "display alert "+asQuote(title)+" message "+asQuote(text)+" as critical").Run()
}

func nativeIsFullscreen(w webview.WebView) bool { return C.vf_is_fullscreen(w.Window()) == 1 }

func nativeSetFullscreen(w webview.WebView, on bool) {
	if nativeIsFullscreen(w) != on {
		C.vf_toggle_fullscreen(w.Window())
	}
}

func nativeSetZoom(w webview.WebView, z float64) { C.vf_zoom(w.Window(), C.double(z)) }

func nativeOpen(target string) error { return exec.Command("open", target).Start() }

func nativeReveal(p string) error {
	if _, err := os.Stat(p); err != nil {
		return err
	}
	return exec.Command("open", "-R", p).Start()
}
