//go:build windows && !uninstaller

package main

import _ "embed"

// Das Setup enthält die Programmdateien als komprimiertes ZIP-Paket
// (VertexForge Studio.exe + Deinstallationsprogramm).
//
//go:embed payload/app.zip
var payload []byte

const isUninstaller = false
