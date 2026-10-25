#!/bin/bash
# ---------------------------------------------------------------------------
# Script portátil de build Tauri — funciona em Linux e Windows (via Git Bash).
#
# Uso:
#   bash ci-builders/build-tauri.sh                        # build release padrão
#   bash ci-builders/build-tauri.sh --debug                # build debug
#   bash ci-builders/build-tauri.sh --target x86_64-pc-windows-gnu
#   bash ci-builders/build-tauri.sh --deb                  # build .deb (Linux only)
#   bash ci-builders/build-tauri.sh --bundle               # também executa tauri bundle
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAURI="$ROOT/src-tauri"
BUILD_TYPE="release"
TARGET=""
DO_DEB=false
DO_BUNDLE=false

# Parse args
while [[ $# -gt 0 ]]; do
    case $1 in
        --debug)    BUILD_TYPE="debug"; shift ;;
        --deb)      DO_DEB=true; shift ;;
        --bundle)   DO_BUNDLE=true; shift ;;
        --target)   TARGET="$2"; shift 2 ;;
        --target=*) TARGET="${1#*=}"; shift ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

cd "$TAURI"

echo "[build] type: $BUILD_TYPE"
echo "[build] target: ${TARGET:-native}"
echo "[build] deb: $DO_DEB  bundle: $DO_BUNDLE"

# Configurar flags de build
export CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-1}"
export RUSTFLAGS="${RUSTFLAGS:--C opt-level=0 -C codegen-units=8 -C embed-bitcode=no -C lto=off}"

# Gold linker em Linux (salva tempo de link)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    export LD="${LD:-/usr/bin/ld.gold}"
fi

# Se target foi especificado, usar --target
TARGET_FLAG=""
if [[ -n "$TARGET" ]]; then
    TARGET_FLAG="--target $TARGET"
fi

# ---------------------------------------------------------------------------
# Passo 1 — compilar lib (cdylib + rlib)
# ---------------------------------------------------------------------------
echo "[build] compiling lib (cdylib + rlib)..."
cargo build $TARGET_FLAG --$BUILD_TYPE --lib
echo "[build] lib OK"

# ---------------------------------------------------------------------------
# Passo 2 — compilar binário
# ---------------------------------------------------------------------------
echo "[build] linking binary..."
cargo build $TARGET_FLAG --$BUILD_TYPE --bin app
echo "[build] binary OK"

# ---------------------------------------------------------------------------
# Passo 3 — criar symlinks para compatibilidade com Tauri
# ---------------------------------------------------------------------------
echo "[build] creating symlinks for tauri compatibility..."
TARGET_DIR="$(pwd)/target/$BUILD_TYPE"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux: symlink para o binário e .so
    BIN=$(ls -t target/$BUILD_TYPE/deps/app-* 2>/dev/null | grep -v '\.d$' | head -1)
    if [[ -n "$BIN" ]]; then
        rm -f "$TARGET_DIR/app"
        ln -sf "$(realpath "$BIN")" "$TARGET_DIR/app"
        echo "[build] app  -> $(basename "$BIN") ($(ls -lh "$BIN" | awk '{print $5}'))"
    else
        echo "[build] WARNING: binary not found in deps/" >&2
        exit 1
    fi

    LIB="target/$BUILD_TYPE/deps/libapp_lib.so"
    if [[ -f "$LIB" ]]; then
        rm -f "$TARGET_DIR/libapp_lib.so"
        ln -sf "$(realpath "$LIB")" "$TARGET_DIR/libapp_lib.so"
        echo "[build] lib  -> libapp_lib.so ($(ls -lh "$LIB" | awk '{print $5}'))"
    fi

elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    # Windows: copiar .exe e .dll
    BIN=$(ls -t target/$BUILD_TYPE/deps/app-*.exe 2>/dev/null | head -1)
    if [[ -n "$BIN" ]]; then
        rm -f "$TARGET_DIR/app.exe"
        cp "$BIN" "$TARGET_DIR/app.exe"
        echo "[build] app.exe -> $(basename "$BIN") ($(ls -lh "$BIN" | awk '{print $5}'))"
    else
        echo "[build] WARNING: binary not found in deps/" >&2
        exit 1
    fi

    LIB="target/$BUILD_TYPE/deps/libapp_lib.dll"
    if [[ -f "$LIB" ]]; then
        rm -f "$TARGET_DIR/libapp_lib.dll"
        cp "$LIB" "$TARGET_DIR/libapp_lib.dll"
        echo "[build] lib    -> libapp_lib.dll ($(ls -lh "$LIB" | awk '{print $5}'))"
    fi

else
    echo "[build] Unsupported OS: $OSTYPE" >&2
    exit 1
fi

echo "[build] symlinks OK"
ls -la "$TARGET_DIR/app"* "$TARGET_DIR/libapp_lib."* 2>/dev/null || true

# ---------------------------------------------------------------------------
# Passo 4 — construir .deb (somente Linux)
# ---------------------------------------------------------------------------
if $DO_DEB && [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "[build] building .deb..."
    bash "$TAURI/build-deb.sh"
    echo "[build] .deb OK"
fi

# ---------------------------------------------------------------------------
# Passo 5 — tauri bundle (opcional, para .exe NSIS no Windows)
# ---------------------------------------------------------------------------
if $DO_BUNDLE; then
    echo "[build] running tauri bundle..."
    npx tauri build
    echo "[build] bundle created in target/$BUILD_TYPE/bundle/"
fi

echo "[build] done"
