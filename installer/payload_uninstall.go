//go:build windows && uninstaller

package main

// Das Deinstallationsprogramm ist ein eigenes, kleines Programm ohne eingebettete Dateien.
var payload []byte

const isUninstaller = true
