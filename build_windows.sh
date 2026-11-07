#!/usr/bin/env bash
# Baut VertexForge Studio für Windows: App, Deinstallationsprogramm, Setup.
# Benötigt Go (>= 1.25), Python 3 und go-winres (go install github.com/tc-hib/go-winres@v0.3.3).
set -euo pipefail
cd "$(dirname "$0")"
export GOOS=windows GOARCH=amd64 CGO_ENABLED=0
# Bewusst ohne "-s -w": Programme mit Debug-Symbolen lösen deutlich seltener
# Fehlalarme in Virenscannern aus.
LDFLAGS="-H windowsgui"
mkdir -p dist

python3 build.py --desktop
go-winres make --in winres/winres.json --arch amd64
go build -trimpath -ldflags "$LDFLAGS" -o "dist/VertexForge-Studio.exe" .

cd installer
go-winres make --in winres/uninstall.json --arch amd64
go build -trimpath -tags uninstaller -ldflags "$LDFLAGS" -o "../dist/Uninstall-VertexForge-Studio.exe" .
python3 - <<'PY'
import zipfile
with zipfile.ZipFile('payload/app.zip', 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    z.write('../dist/VertexForge-Studio.exe', 'VertexForge Studio.exe')
    z.write('../dist/Uninstall-VertexForge-Studio.exe', 'Uninstall VertexForge Studio.exe')
    z.write('../winres/webview2/WebView2Loader.dll', 'WebView2Loader.dll')
PY
go-winres make --in winres/winres.json --arch amd64
go build -trimpath -ldflags "$LDFLAGS" -o "../dist/VertexForge-Studio-Setup.exe" .
cd ..
cp dist/vertexforge_studio.html dist/VertexForge-Studio-Browser.html
cp winres/webview2/WebView2Loader.dll dist/WebView2Loader.dll
# Portable Version: App + DLL in einem Ordner, ohne Installation
rm -rf dist/portable && mkdir -p "dist/portable/VertexForge Studio"
cp dist/VertexForge-Studio.exe "dist/portable/VertexForge Studio/VertexForge Studio.exe"
cp winres/webview2/WebView2Loader.dll "dist/portable/VertexForge Studio/"
(cd dist/portable && python3 -c "import shutil; shutil.make_archive('../VertexForge-Studio-Portable', 'zip', '.', 'VertexForge Studio')")
ls -la dist
