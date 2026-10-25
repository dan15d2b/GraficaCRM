#!/bin/bash
set -euo pipefail
# ---------------------------------------------------------------------------
# Build do binário Tauri em máquina com ~16 GB RAM.
#
# Problema: `pnpm tauri build --no-bundle` falha com SIGKILL (OOM) no link
# do app_lib (cdylib) mesmo com opt-level=0, gold linker, 1 job.
# Causa: tauri CLI passa `-C opt-level=3` adicional via metadata flag,
# ignorando RUSTFLAGS para a fase de link.
#
# Solução: construir via cargo direto (que respeita RUSTFLAGS) e criar
# symlinks ABSOLUTOS para os nomes que o tauri espera:
#   target/release/app            → binário principal
#   target/release/libapp_lib.so  → shared lib
# ---------------------------------------------------------------------------
export CARGO_BUILD_JOBS=1
export RUSTFLAGS="-C opt-level=0 -C codegen-units=8 -C embed-bitcode=no -C lto=off"
export LD=/usr/bin/ld.gold
cd "$(dirname "$0")"

echo "[build] compiling lib (cdylib + rlib)..."
cargo build --release --lib

echo "[build] linking binary..."
cargo build --release --bin app

echo "[build] creating symlinks for tauri compatibility..."
TARGET_DIR="$(pwd)/target/release"

# Create absolute symlink to the actual binary in deps/
BIN=$(ls -t target/release/deps/app-* 2>/dev/null | grep -v '\.d$' | head -1)
if [ -n "$BIN" ]; then
  rm -f "$TARGET_DIR/app"
  ln -sf "$(realpath "$BIN")" "$TARGET_DIR/app"
  echo "[build] app  -> $(basename "$BIN") ($(ls -lh "$BIN" | awk '{print $5}'))"
else
  echo "[build] WARNING: binary not found in deps/" >&2
  exit 1
fi

# Create absolute symlink to the .so
LIB="target/release/deps/libapp_lib.so"
if [ -f "$LIB" ]; then
  rm -f "$TARGET_DIR/libapp_lib.so"
  ln -sf "$(realpath "$LIB")" "$TARGET_DIR/libapp_lib.so"
  echo "[build] lib  -> libapp_lib.so ($(ls -lh "$LIB" | awk '{print $5}'))"
fi

echo "[build] done"
ls -la "$TARGET_DIR/app" "$TARGET_DIR/libapp_lib.so"
