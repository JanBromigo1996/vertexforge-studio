#!/usr/bin/env bash
# Baut die Linux-App (x86_64) als .deb und als .tar.gz.
# Benötigt zum Bauen: golang, gcc, libwebkit2gtk-4.1-dev
# Läuft auf: Ubuntu 22.04+, Debian 12+, Linux Mint 21+, Fedora 36+, Arch …
set -euo pipefail
cd "$(dirname "$0")"
VER=$(grep -o "appVersion = \"[^\"]*\"" shared.go | cut -d'"' -f2)
python3 build.py --desktop
OUT=dist/linux; rm -rf "$OUT"; mkdir -p "$OUT"
CGO_ENABLED=1 go build -trimpath -ldflags "-s -w" -o "$OUT/vertexforge-studio" .

# --- .tar.gz (zum Entpacken, mit install.sh für das Startmenü) ---
T="$OUT/VertexForge-Studio-linux-x86_64"; mkdir -p "$T"
cp "$OUT/vertexforge-studio" packaging/linux/vertexforge-studio.png packaging/linux/vertexforge-studio.desktop packaging/linux/install.sh "$T/"
cp LICENSE "$T/"
chmod +x "$T/install.sh" "$T/vertexforge-studio"
tar -C "$OUT" --owner=0 --group=0 -czf dist/VertexForge-Studio-linux-x86_64.tar.gz "$(basename "$T")"

# --- .deb ---
D="$OUT/deb"
install -Dm755 "$OUT/vertexforge-studio" "$D/usr/bin/vertexforge-studio"
install -Dm644 packaging/linux/vertexforge-studio.desktop "$D/usr/share/applications/vertexforge-studio.desktop"
install -Dm644 packaging/linux/vertexforge-studio.png "$D/usr/share/icons/hicolor/512x512/apps/vertexforge-studio.png"
install -Dm644 LICENSE "$D/usr/share/doc/vertexforge-studio/copyright"
mkdir -p "$D/DEBIAN"
SIZE=$(du -sk "$D/usr" | cut -f1)
cat > "$D/DEBIAN/control" <<CTRL
Package: vertexforge-studio
Version: $VER
Section: graphics
Priority: optional
Architecture: amd64
Depends: libwebkit2gtk-4.1-0, libgtk-3-0
Recommends: xdg-utils
Installed-Size: $SIZE
Maintainer: JanBromigo1996 <JanBromigo1996@users.noreply.github.com>
Homepage: https://vertexforge.pages.dev
Description: Planning and organisation tool for 3D film projects
 Free, open-source project planner for 3D artists: pipeline, mind board,
 shot list, story and collectible character cards. Works fully offline.
CTRL
cat > "$D/DEBIAN/postinst" <<'POST'
#!/bin/sh
set -e
command -v update-desktop-database >/dev/null && update-desktop-database -q /usr/share/applications || true
command -v gtk-update-icon-cache >/dev/null && gtk-update-icon-cache -q /usr/share/icons/hicolor || true
POST
cp "$D/DEBIAN/postinst" "$D/DEBIAN/postrm"; chmod 755 "$D/DEBIAN/postinst" "$D/DEBIAN/postrm"
dpkg-deb --root-owner-group --build "$D" "dist/VertexForge-Studio-linux-amd64.deb" >/dev/null
rm -rf "$D" "$T"
ls -la dist/VertexForge-Studio-linux-*
