#!/usr/bin/env bash
# Sobe o DeskcommCRM da raiz com a marca CRMGráfica.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
KIT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Erro: falta .env.local na raiz. Copie .env.example e preencha o Supabase." >&2
  echo "  cp .env.example .env.local" >&2
  exit 1
fi

# Garante marca mesmo se o operador pulou o passo anterior
bash "${KIT}/scripts/aplicar-marca.sh" "${NEXT_PUBLIC_APP_URL:-}"

if [[ ! -d node_modules ]]; then
  echo "→ Instalando dependências (pnpm)…"
  pnpm install
fi

if [[ ! -x scripts/local-stack.sh ]] && [[ ! -f scripts/local-stack.sh ]]; then
  echo "Erro: scripts/local-stack.sh não encontrado. Você está na pasta certa do Deskcomm?" >&2
  exit 1
fi

echo "→ Subindo stack local Deskcomm (app + deps)…"
bash scripts/local-stack.sh up

echo ""
echo "✓ Stack em subida. Acompanhe com: pnpm local:logs"
echo "  App: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
echo "  Depois do onboarding → ${KIT}/pacote-grafica.md"
