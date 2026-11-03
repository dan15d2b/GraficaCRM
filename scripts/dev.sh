#!/bin/bash
# Script de desenvolvimento - inicia todos os serviços localmente
set -e

echo "Iniciando GraficaCRM em modo desenvolvimento..."
echo ""

# Backend
echo "[1/4] Iniciando backend..."
cd "$(dirname "$0")/.." && cd backend
pnpm dev &
BACKEND_PID=$!

# Frontend
echo "[2/4] Iniciando frontend..."
cd "$(dirname "$0")/.." && cd frontend-node
pnpm dev &
FRONTEND_PID=$!

# Admin Panel
echo "[3/4] Iniciando admin panel..."
cd "$(dirname "$0")/.." && cd admin-panel
pnpm dev &
ADMIN_PID=$!

# WAHA (se configurado)
if grep -q "WAHA_API_KEY=." ../.env.local 2>/dev/null; then
    echo "[4/4] Iniciando WAHA..."
    docker compose up -d
else
    echo "[4/4] WAHA não configurado (pule esta etapa)"
fi

echo ""
echo "Serviços iniciados:"
echo "  Backend: http://localhost:3000"
echo "  Frontend: http://localhost:1420"
echo "  Admin: http://localhost:4000"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços"

# Aguardar interrupção
trap "kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID 2>/dev/null; exit" INT
wait
