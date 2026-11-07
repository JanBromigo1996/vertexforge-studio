//go:build windows

// Package winutil enthält kleine Windows-Helfer ohne externe Prozesse
// (kein PowerShell/cmd): Programm-Icons als PNG, Verknüpfungen (.lnk) lesen
// und schreiben, Ordnerauswahl und bekannte Ordnerpfade.
package winutil

import (
	"bytes"
	"encoding/binary"
	"errors"
	"image"
	"image/png"
	"os"
	"strings"
	"syscall"
	"unicode/utf16"
	"unsafe"
)

var (
	user32  = syscall.NewLazyDLL("user32.dll")
	gdi32   = syscall.NewLazyDLL("gdi32.dll")
	shell32 = syscall.NewLazyDLL("shell32.dll")
	ole32   = syscall.NewLazyDLL("ole32.dll")

	procPrivateExtractIcons = user32.NewProc("PrivateExtractIconsW")
	procDestroyIcon         = user32.NewProc("DestroyIcon")
	procGetIconInfo         = user32.NewProc("GetIconInfo")
	procGetDC               = user32.NewProc("GetDC")
	procReleaseDC           = user32.NewProc("ReleaseDC")
	procGetDIBits           = gdi32.NewProc("GetDIBits")
	procDeleteObject        = gdi32.NewProc("DeleteObject")
	procSHBrowseForFolder   = shell32.NewProc("SHBrowseForFolderW")
	procSHGetPathFromIDList = shell32.NewProc("SHGetPathFromIDListW")
	procCoTaskMemFree       = ole32.NewProc("CoTaskMemFree")
	procCoInitializeEx      = ole32.NewProc("CoInitializeEx")
)

type iconInfo struct {
	fIcon    int32
	xHotspot uint32
	yHotspot uint32
	hbmMask  uintptr
	hbmColor uintptr
}

type bitmapInfoHeader struct {
	Size          uint32
	Width         int32
	Height        int32
	Planes        uint16
	BitCount      uint16
	Compression   uint32
	SizeImage     uint32
	XPelsPerMeter int32
	YPelsPerMeter int32
	ClrUsed       uint32
	ClrImportant  uint32
}

// IconPNG liest das erste Icon einer .exe/.dll in der gewünschten Größe und gibt es als PNG zurück.
func IconPNG(path string, size int) ([]byte, error) {
	p, err := syscall.UTF16PtrFromString(path)
	if err != nil {
		return nil, err
	}
	var h uintptr
	var id uint32
	n, _, _ := procPrivateExtractIcons.Call(uintptr(unsafe.Pointer(p)), 0, uintptr(size), uintptr(size), uintptr(unsafe.Pointer(&h)), uintptr(unsafe.Pointer(&id)), 1, 0)
	if n == 0 || n == 0xFFFFFFFF || h == 0 {
		return nil, errors.New("no icon")
	}
	defer procDestroyIcon.Call(h)
	var ii iconInfo
	if r, _, _ := procGetIconInfo.Call(h, uintptr(unsafe.Pointer(&ii))); r == 0 {
		return nil, errors.New("GetIconInfo failed")
	}
	if ii.hbmMask != 0 {
		defer procDeleteObject.Call(ii.hbmMask)
	}
	if ii.hbmColor == 0 {
		return nil, errors.New("monochrome icon")
	}
	defer procDeleteObject.Call(ii.hbmColor)

	bih := bitmapInfoHeader{Size: 40, Width: int32(size), Height: -int32(size), Planes: 1, BitCount: 32}
	buf := make([]byte, size*size*4)
	dc, _, _ := procGetDC.Call(0)
	defer procReleaseDC.Call(0, dc)
	lines, _, _ := procGetDIBits.Call(dc, ii.hbmColor, 0, uintptr(size), uintptr(unsafe.Pointer(&buf[0])), uintptr(unsafe.Pointer(&bih)), 0)
	if lines == 0 {
		return nil, errors.New("GetDIBits failed")
	}
	img := image.NewNRGBA(image.Rect(0, 0, size, size))
	hasAlpha := false
	for i := 0; i < size*size; i++ {
		if buf[i*4+3] != 0 {
			hasAlpha = true
			break
		}
	}
	for i := 0; i < size*size; i++ {
		b, g, r, a := buf[i*4], buf[i*4+1], buf[i*4+2], buf[i*4+3]
		if !hasAlpha {
			a = 255
		}
		// GetDIBits liefert vormultipliziertes Alpha – zurückrechnen
		if a > 0 && a < 255 {
			r = uint8(min(255, int(r)*255/int(a)))
			g = uint8(min(255, int(g)*255/int(a)))
			b = uint8(min(255, int(b)*255/int(a)))
		}
		img.Pix[i*4], img.Pix[i*4+1], img.Pix[i*4+2], img.Pix[i*4+3] = r, g, b, a
	}
	var out bytes.Buffer
	if err := png.Encode(&out, img); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}

// LnkTarget liest das Ziel einer Windows-Verknüpfung (.lnk, MS-SHLLINK: LinkInfo/LocalBasePath).
func LnkTarget(path string) string {
	d, err := os.ReadFile(path)
	if err != nil || len(d) < 0x4C || binary.LittleEndian.Uint32(d[0:4]) != 0x4C {
		return ""
	}
	flags := binary.LittleEndian.Uint32(d[0x14:0x18])
	off := 0x4C
	if flags&0x01 != 0 { // HasLinkTargetIDList
		if off+2 > len(d) {
			return ""
		}
		off += 2 + int(binary.LittleEndian.Uint16(d[off:off+2]))
	}
	if flags&0x02 == 0 || off+28 > len(d) { // HasLinkInfo
		return ""
	}
	li := d[off:]
	liSize := int(binary.LittleEndian.Uint32(li[0:4]))
	hdr := int(binary.LittleEndian.Uint32(li[4:8]))
	if liSize > len(li) {
		return ""
	}
	if hdr >= 0x24 { // Unicode-Variante vorhanden
		uo := int(binary.LittleEndian.Uint32(li[0x1C:0x20]))
		if uo > 0 && uo < liSize {
			var u []uint16
			for i := uo; i+1 < liSize; i += 2 {
				c := binary.LittleEndian.Uint16(li[i : i+2])
				if c == 0 {
					break
				}
				u = append(u, c)
			}
			if len(u) > 0 {
				return string(utf16.Decode(u))
			}
		}
	}
	bo := int(binary.LittleEndian.Uint32(li[0x10:0x14]))
	if bo <= 0 || bo >= liSize {
		return ""
	}
	end := bytes.IndexByte(li[bo:liSize], 0)
	if end < 0 {
		return ""
	}
	return string(li[bo : bo+end]) // ANSI – für normale Pfade ausreichend
}

func lnkString(s string) []byte {
	u := utf16.Encode([]rune(s))
	b := make([]byte, 2+2*len(u))
	binary.LittleEndian.PutUint16(b, uint16(len(u)))
	for i, c := range u {
		binary.LittleEndian.PutUint16(b[2+2*i:], c)
	}
	return b
}

// WriteLnk schreibt eine einfache Windows-Verknüpfung (ohne COM, nach MS-SHLLINK).
func WriteLnk(lnkPath, target, workDir, description, iconPath string) error {
	var b bytes.Buffer
	le := func(v interface{}) { _ = binary.Write(&b, binary.LittleEndian, v) }
	const (
		hasLinkInfo  = 0x02
		hasName      = 0x04
		hasWorkDir   = 0x10
		hasIcon      = 0x40
		isUnicode    = 0x80
		fileAttrNorm = 0x20
	)
	flags := uint32(hasLinkInfo | hasName | hasWorkDir | hasIcon | isUnicode)
	// ShellLinkHeader
	le(uint32(0x4C))
	b.Write([]byte{0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46}) // CLSID
	le(flags)
	le(uint32(fileAttrNorm))
	b.Write(make([]byte, 24)) // Zeiten
	le(uint32(0))             // FileSize
	le(int32(0))              // IconIndex
	le(uint32(1))             // SW_SHOWNORMAL
	le(uint16(0))             // HotKey
	b.Write(make([]byte, 10)) // reserviert
	// LinkInfo (lokaler Pfad, ANSI + Unicode)
	ansi := append([]byte(target), 0)
	uni := utf16.Encode([]rune(target + "\x00"))
	const hdrSize = 0x24
	volOff := hdrSize
	vol := []byte{0x11, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0x10, 0, 0, 0, 0} // VolumeID: Größe 17, DRIVE_FIXED, Label leer
	baseOff := volOff + len(vol)
	suffixOff := baseOff + len(ansi)
	uniBaseOff := suffixOff + 1
	uniSuffixOff := uniBaseOff + 2*len(uni)
	total := uniSuffixOff + 2
	le(uint32(total))
	le(uint32(hdrSize))
	le(uint32(0x01)) // VolumeIDAndLocalBasePath
	le(uint32(volOff))
	le(uint32(baseOff))
	le(uint32(0)) // CommonNetworkRelativeLink
	le(uint32(suffixOff))
	le(uint32(uniBaseOff))
	le(uint32(uniSuffixOff))
	b.Write(vol)
	b.Write(ansi)
	b.WriteByte(0)
	for _, c := range uni {
		le(c)
	}
	le(uint16(0))
	// StringData
	b.Write(lnkString(description))
	b.Write(lnkString(workDir))
	b.Write(lnkString(iconPath))
	le(uint32(0)) // TerminalBlock
	return os.WriteFile(lnkPath, b.Bytes(), 0o644)
}

type browseInfo struct {
	hwndOwner      uintptr
	pidlRoot       uintptr
	pszDisplayName *uint16
	lpszTitle      *uint16
	ulFlags        uint32
	lpfn           uintptr
	lParam         uintptr
	iImage         int32
}

// BrowseFolder zeigt den Windows-Ordnerdialog (BIF_NEWDIALOGSTYLE) und gibt den gewählten Pfad zurück.
func BrowseFolder(hwnd uintptr, title string) string {
	_, _, _ = procCoInitializeEx.Call(0, 0x2) // COINIT_APARTMENTTHREADED
	name := make([]uint16, 260)
	t, _ := syscall.UTF16PtrFromString(title)
	bi := browseInfo{hwndOwner: hwnd, pszDisplayName: &name[0], lpszTitle: t, ulFlags: 0x0001 | 0x0040} // RETURNONLYFSDIRS | NEWDIALOGSTYLE
	pidl, _, _ := procSHBrowseForFolder.Call(uintptr(unsafe.Pointer(&bi)))
	if pidl == 0 {
		return ""
	}
	defer procCoTaskMemFree.Call(pidl)
	out := make([]uint16, 1024)
	if r, _, _ := procSHGetPathFromIDList.Call(pidl, uintptr(unsafe.Pointer(&out[0]))); r == 0 {
		return ""
	}
	return syscall.UTF16ToString(out)
}

// CommonDesktop / CommonPrograms: Ordner für Verknüpfungen aller Benutzer.
func CommonDesktop() string {
	if p := os.Getenv("PUBLIC"); p != "" {
		return p + `\Desktop`
	}
	return `C:\Users\Public\Desktop`
}

func CommonPrograms() string {
	pd := os.Getenv("ProgramData")
	if pd == "" {
		pd = `C:\ProgramData`
	}
	return pd + `\Microsoft\Windows\Start Menu\Programs`
}

// Running prüft, ob eine .exe gerade läuft (laufende Programme lassen sich nicht zum Schreiben öffnen).
func Running(exe string) bool {
	if _, err := os.Stat(exe); err != nil {
		return false
	}
	f, err := os.OpenFile(exe, os.O_WRONLY, 0)
	if err != nil {
		return strings.Contains(strings.ToLower(err.Error()), "used by another process") || errors.Is(err, syscall.Errno(32))
	}
	f.Close()
	return false
}
