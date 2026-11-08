#!/bin/sh
# Installiert VertexForge Studio für den aktuellen Benutzer (ohne root):
#   ~/.local/bin, Startmenü-Eintrag und Symbol.  Entfernen: ./install.sh --uninstall
set -e
cd "$(dirname "$0")"
BIN="$HOME/.local/bin"; APPS="$HOME/.local/share/applications"; ICONS="$HOME/.local/share/icons/hicolor/512x512/apps"
if [ "$1" = "--uninstall" ]; then
  rm -f "$BIN/vertexforge-studio" "$APPS/vertexforge-studio.desktop" "$ICONS/vertexforge-studio.png"
  echo "VertexForge Studio entfernt / removed. (Projekte bleiben in ~/.local/share/vertexforge-studio)"
  exit 0
fi
mkdir -p "$BIN" "$APPS" "$ICONS"
install -m755 vertexforge-studio "$BIN/vertexforge-studio"
install -m644 vertexforge-studio.png "$ICONS/vertexforge-studio.png"
sed "s|^Exec=vertexforge-studio|Exec=$BIN/vertexforge-studio|" vertexforge-studio.desktop > "$APPS/vertexforge-studio.desktop"
command -v update-desktop-database >/dev/null && update-desktop-database -q "$APPS" || true
echo "VertexForge Studio installiert / installed: Startmenü / app menu → VertexForge Studio"
