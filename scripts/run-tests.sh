#!/usr/bin/env bash
# Script de testes automático para GraficaCRM
# Uso:
#   bash scripts/run-tests.sh
#   timeout 3600 bash scripts/run-tests.sh
#
# O script:
#   1. Sincroniza o .env do .env.example (se .env não existir)
#   2. Verifica se o Git tem commits (cria se não tiver)
#   3. Executa o pnpm vitest run com timeout de 1h
#
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== GraficaCRM - Script de Testes Automático ==="
echo "Data/hora: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "Diretório: $(pwd)"
echo ""

# 1. Sincronizar .env
if [ ! -f .env ] && [ -f .env.example ]; then
  echo "[1/4] .env não encontrado. Copiando do .env.example..."
  cp .env.example .env
  echo "      Arquivo .env criado com base no .env.example"
elif [ -f .env ]; then
  echo "[1/4] .env já existe. Mantendo."
fi
echo ""

# 2. Verificar Git
if ! git rev-parse HEAD >/dev/null 2>&1; then
  echo "[2/4] Git repositório não inicializado. Criando..."
  git init -q
  git add -A
  git commit -qm "Configurar ambiente de teste"
  echo "      Git inicializado com commit inicial"
elif [ -z "$(git log --oneline -1)" ]; then
  echo "[2/4] Git sem commits. Adicionando..."
  git add -A
  git commit -qm "Configurar ambiente de teste"
  echo "      Commit adicionado"
else
  echo "[2/4] Git repositório com commits. ($(git log --oneline -1))"
fi
echo ""

# 3. Rodar vitest
if command -v pnpm >/dev/null 2>&1; then
  echo "[3/4] Rodando pnpm vitest run (timeout: 3600s)..."
  timeout 3600 pnpm vitest run --reporter=verbose 2>&1 | tee /tmp/vitest-final.log
  VITEST_EXIT=${PIPESTATUS[0]}
else
  echo "[3/4] pnpm não encontrado. Instalando dependências..."
  pnpm install
  echo ""
  echo "[3/4] Rodando pnpm vitest run (timeout: 3600s)..."
  timeout 3600 pnpm vitest run --reporter=verbose 2>&1 | tee /tmp/vitest-final.log
  VITEST_EXIT=${PIPESTATUS[0]}
fi

echo ""
echo "=== Resultado ==="
if [ "$VITEST_EXIT" -eq 0 ]; then
  echo "Passei: todos os testes rodaram com sucesso."
else
  echo "Falhou: o vitest retornou código $VITEST_EXIT."
  echo "Log salvo em: /tmp/vitest-final.log"
  echo ""
  echo "--- Últimas linhas do log ---"
  tail -20 /tmp/vitest-final.log
fi
exit $VITEST_EXIT
