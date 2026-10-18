#!/usr/bin/env bash
# Aplica a marca CRMGráfica no .env.local do Deskcomm (raiz do repositório).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT}/.env.local"
APP_URL="${1:-}"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "${ROOT}/.env.example" ]]; then
    echo "→ Criando .env.local a partir de .env.example"
    cp "${ROOT}/.env.example" "$ENV_FILE"
  else
    echo "Erro: não achei .env.local nem .env.example em ${ROOT}" >&2
    exit 1
  fi
fi

upsert() {
  local key="$1" value="$2"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    # Substitui só a linha da chave (preserva o resto do arquivo)
    awk -v k="$key" -v v="$value" '
      BEGIN { done=0 }
      $0 ~ ("^" k "=") { print k "=" v; done=1; next }
      { print }
      END { if (!done) print k "=" v }
    ' "$ENV_FILE" > "${ENV_FILE}.tmp"
    mv "${ENV_FILE}.tmp" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

upsert "APP_NAME" "CRMGráfica"
upsert "APP_ACCENT_HEX" "#2563EB"

if [[ -n "$APP_URL" ]]; then
  upsert "NEXT_PUBLIC_APP_URL" "$APP_URL"
fi

echo "✓ Marca aplicada em ${ENV_FILE}"
echo "  APP_NAME=CRMGráfica"
echo "  APP_ACCENT_HEX=#2563EB"
[[ -n "$APP_URL" ]] && echo "  NEXT_PUBLIC_APP_URL=${APP_URL}"
echo ""
echo "Próximo passo: bash crmgrafica-2.0/scripts/subir-local.sh"
echo "Depois do onboarding: abra crmgrafica-2.0/pacote-grafica.md"
