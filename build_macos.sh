#!/usr/bin/env bash
# Baut die macOS-App (Universal: Apple Silicon + Intel) als .dmg – läuft nur auf einem Mac.
# Die App ist nicht von Apple notarisiert (kostet 99 $/Jahr); sie wird "ad hoc" signiert.
set -euo pipefail
cd "$(dirname "$0")"
VER=$(grep -o "appVersion = \"[^\"]*\"" shared.go | cut -d'"' -f2)
python3 build.py
OUT=dist/macos; rm -rf "$OUT"; mkdir -p "$OUT"
export CGO_ENABLED=1 MACOSX_DEPLOYMENT_TARGET=11.0
GOARCH=arm64 CC="clang -arch arm64"  go build -trimpath -ldflags "-s -w" -o "$OUT/vf-arm64" .
GOARCH=amd64 CC="clang -arch x86_64" go build -trimpath -ldflags "-s -w" -o "$OUT/vf-amd64" .
APP="$OUT/VertexForge Studio.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
lipo -create -output "$APP/Contents/MacOS/VertexForge Studio" "$OUT/vf-arm64" "$OUT/vf-amd64"
sed "s/@VERSION@/$VER/g" packaging/macos/Info.plist > "$APP/Contents/Info.plist"
cp packaging/macos/icon.icns "$APP/Contents/Resources/icon.icns"
codesign --force --deep --sign - "$APP"
codesign --verify --verbose "$APP"
# DMG mit Verknüpfung zum Programme-Ordner
STAGE="$OUT/dmg"; mkdir -p "$STAGE"; cp -R "$APP" "$STAGE/"; ln -s /Applications "$STAGE/Applications"
hdiutil create -volname "VertexForge Studio" -srcfolder "$STAGE" -ov -format UDZO "dist/VertexForge-Studio-macOS.dmg"
rm -rf "$STAGE" "$OUT/vf-arm64" "$OUT/vf-amd64"
shasum -a 256 dist/VertexForge-Studio-macOS.dmg
