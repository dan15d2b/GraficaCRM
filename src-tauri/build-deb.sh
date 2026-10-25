#!/bin/bash
# ---------------------------------------------------------------------------
# Constrói o .deb do CRMGráfica — frontend estático, sem Node.js.
# Binário Rust já compilado + assets embutidos (index.html + CSS + JS).
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAURI="$ROOT/src-tauri"
STAGING="$(mktemp -d /tmp/crmgrafica-deb-XXXXXX)"
VERSION="0.1.0"
PKGNAME="crmgrafica"
ARCH="amd64"

cleanup() { rm -rf "$STAGING"; }
trap cleanup EXIT

echo "[deb] staging: $STAGING"

# --- Estrutura do app (padrão Tauri Linux) ---
APPDIR="$STAGING/opt/$PKGNAME"
mkdir -p "$APPDIR/static"    # frontend embarcado (index.html + css + js)
mkdir -p "$APPDIR/icons"
mkdir -p "$APPDIR/capabilities"
mkdir -p "$APPDIR/gen/schemas"

# Binário Rust (resolver symlink)
BIN_SRC="$(readlink -f "$TAURI/target/release/app")"
echo "[deb] binary: $BIN_SRC ($(ls -lh "$BIN_SRC" | awk '{print $5}'))"
cp "$BIN_SRC" "$APPDIR/app"
chmod 755 "$APPDIR/app"

# Shared lib
LIB_SRC="$(readlink -f "$TAURI/target/release/libapp_lib.so")"
echo "[deb] lib: $LIB_SRC ($(ls -lh "$LIB_SRC" | awk '{print $5}'))"
cp "$LIB_SRC" "$APPDIR/libapp_lib.so"

# Frontend estático (sem Node.js!)
echo "[deb] static: $TAURI/resources/static"
cp -a "$TAURI/resources/static/." "$APPDIR/static/"

# Config e capabilities
cp "$TAURI/tauri.conf.json" "$APPDIR/"
cp -a "$TAURI/capabilities/." "$APPDIR/capabilities/"
cp -a "$TAURI/gen/." "$APPDIR/gen/"

# Ícones
cp "$TAURI/icons/128x128.png" "$APPDIR/icons/crmgrafica.png"
cp "$TAURI/icons/icon.icns" "$APPDIR/icons/"
cp "$TAURI/icons/icon.ico" "$APPDIR/icons/"

# --- Metadados do pacote ---
CONTROL="$STAGING/DEBIAN"
mkdir -p "$CONTROL"

cat > "$CONTROL/control" <<EOF
Package: $PKGNAME
Version: $VERSION
Section: utils
Priority: optional
Architecture: $ARCH
Depends: libwebkit2gtk-4.1-0 (>= 2.40), libgtk-3-0 (>= 3.24), libc6 (>= 2.31)
Installed-Size: $(du -sk "$APPDIR" | awk '{print $1}')
Maintainer: CRMGráfica Team <contato@crmgrafica.com.br>
Description: CRM Gráfica — gestão de ordens de produção gráfica
 CRMGráfica é um sistema completo para gráficas que precisa controlar
 orçamentos, pedidos, produção e entregas. Versão desktop (Tauri).
EOF

cat > "$CONTROL/postinst" <<'EOF'
#!/bin/sh
if [ ! -f "/usr/share/applications/crmgrafica.desktop" ]; then
    cat > /usr/share/applications/crmgrafica.desktop <<DESK
[Desktop Entry]
Name=CRM Gráfica
Comment=CRM para gráficas
Exec=/opt/crmgrafica/app
Icon=crmgrafica
Type=Application
Categories=Office;Business;
Terminal=false
DESK
fi
exit 0
EOF
chmod 755 "$CONTROL/postinst"

cat > "$CONTROL/postrm" <<'EOF'
#!/bin/sh
rm -f /usr/share/applications/crmgrafica.desktop
exit 0
EOF
chmod 755 "$CONTROL/postrm"

# Ícone no sistema
ICONDIR="$STAGING/usr/share/icons/hicolor"
for size in 16 32 48 64 128; do
    mkdir -p "$ICONDIR/${size}x${size}/apps"
    if command -v convert &>/dev/null; then
        convert "$TAURI/icons/128x128.png" -resize ${size}x${size} \
            "$ICONDIR/${size}x${size}/apps/crmgrafica.png" 2>/dev/null || \
        cp "$TAURI/icons/128x128.png" "$ICONDIR/${size}x${size}/apps/crmgrafica.png"
    else
        cp "$TAURI/icons/128x128.png" "$ICONDIR/${size}x${size}/apps/crmgrafica.png"
    fi
done

# Desktop file
mkdir -p "$STAGING/usr/share/applications"
cat > "$STAGING/usr/share/applications/crmgrafica.desktop" <<'EOF'
[Desktop Entry]
Name=CRM Gráfica
Comment=CRM para gráficas — gestão de ordens de produção
Exec=/opt/crmgrafica/app
Icon=crmgrafica
Type=Application
Categories=Office;Business;
Terminal=false
StartupNotify=true
EOF

# --- Montar o .deb ---
OUT="$ROOT/src-tauri/target/release/${PKGNAME}_${VERSION}_${ARCH}.deb"
echo "[deb] Construindo: $OUT"
fakeroot dpkg-deb --build --root-owner-group "$STAGING" "$OUT"
echo "[deb] Pronto: $(ls -lh "$OUT" | awk '{print $5, $9}')"
