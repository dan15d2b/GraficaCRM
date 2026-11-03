#!/bin/bash
# Script de produção - inicia serviços em background
set -e

echo "Iniciando GraficaCRM em modo produção..."
echo ""

# Iniciar WAHA
if grep -q "WAHA_API_KEY=." ../.env.local 2>/dev/null; then
    echo "[1/3] Iniciando WAHA..."
    docker compose up -d
else
    echo "[1/3] WAHA não configurado"
fi

# Iniciar Backend
echo "[2/3] Iniciando backend..."
cd "$(dirname "$0")/.." && cd backend
nohup pnpm start > /tmp/graficacrm-backend.log 2>&1 &
echo "  PID: $!"

# Iniciar Admin Panel
echo "[3/3] Iniciando admin panel..."
cd "$(dirname "$0")/.." && cd admin-panel
nohup pnpm start > /tmp/graficacrm-admin.log 2>&1 &
echo "  PID: $!"

echo ""
echo "Serviços iniciados:"
echo "  Backend: http://localhost:3000 (logs: tail -f /tmp/graficacrm-backend.log)"
echo "  Admin: http://localhost:4000 (logs: tail -f /tmp/graficacrm-admin.log)"
echo ""
echo "Acesse http://SEU_DOMINIO/setup para configurar o sistema"
