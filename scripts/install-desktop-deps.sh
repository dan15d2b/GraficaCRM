#!/usr/bin/env bash
# Dependências para compilar o CRM Gráfica no Linux e gerar o .exe do Windows.
# Uso: bash scripts/install-desktop-deps.sh
set -euo pipefail

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo não encontrado. Rode os apt abaixo como root." >&2
  exit 1
fi

sudo apt-get update
sudo apt-get install -y \
  build-essential \
  curl \
  pkg-config \
  libssl-dev \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  gcc-mingw-w64-x86-64 \
  nsis

if ! command -v rustup >/dev/null 2>&1 && ! command -v cargo >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
fi

# shellcheck disable=SC1091
if [ -f "$HOME/.cargo/env" ]; then
  . "$HOME/.cargo/env"
fi

rustup target add x86_64-pc-windows-gnu
rustup target add x86_64-unknown-linux-gnu

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não está no PATH. Instale Node 22 antes do build do frontend." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@9.15.9 --activate
fi

echo "Pronto. Próximo: bash scripts/build-windows.sh"
