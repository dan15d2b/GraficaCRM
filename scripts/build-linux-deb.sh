#!/usr/bin/env bash
# Gera o .deb nativo para testar o desktop nesta máquina Linux.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -f "$HOME/.cargo/env" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.cargo/env"
fi

command -v cargo >/dev/null || { echo "cargo ausente. Rode bash scripts/install-desktop-deps.sh"; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm ausente. Rode bash scripts/install-desktop-deps.sh"; exit 1; }

export CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-1}"

cd "$ROOT/frontend"
pnpm install
pnpm build

cd "$ROOT/src-tauri"
pnpm exec tauri build --bundles deb

echo "Pronto:"
find "$ROOT/src-tauri/target/release/bundle" -type f -name '*.deb' -print
