#!/usr/bin/env bash
# Gera o instalador Windows (.exe NSIS) a partir do Linux.
# Saída: src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f "$HOME/.cargo/env" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.cargo/env"
fi

command -v cargo >/dev/null || { echo "cargo ausente. Rode bash scripts/install-desktop-deps.sh"; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm ausente. Rode bash scripts/install-desktop-deps.sh"; exit 1; }
command -v x86_64-w64-mingw32-gcc >/dev/null || { echo "mingw ausente. Rode bash scripts/install-desktop-deps.sh"; exit 1; }

export CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-1}"

echo "[1/2] frontend"
cd "$ROOT/frontend"
pnpm install
pnpm build

echo "[2/2] instalador Windows"
cd "$ROOT/src-tauri"
pnpm exec tauri build --target x86_64-pc-windows-gnu --bundles nsis

echo "Pronto:"
find "$ROOT/src-tauri/target/x86_64-pc-windows-gnu/release/bundle" -type f -name '*.exe' -print
