#!/bin/bash
set -e

echo "=== Fix Build Script for CRM Gráfica 2.0 ==="

# 1. Remover código antigo que causa conflitos
echo "[1/6] Removendo código antigo..."
rm -rf supabase/
rm -rf platform/
rm -f .env.local .env.local.bak.* a.txt b.txt c.txt 2>/dev/null || true
rm -rf build/ 2>/dev/null || true

# 2. Limpar e reinstalar
echo "[2/6] Reiniciando instalação..."
rm -rf node_modules .next pnpm-lock.yaml
pnpm install

# 3. Build
echo "[3/6] Fazendo build..."
pnpm build

# 4. Gerar JWT_SECRET
echo "[4/6] Gerando JWT_SECRET..."
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET"
echo "SALVO_AQUI_COMPRAR_O_SEGURO" > .env.local

# 5. Configurar .env.local
echo "[5/6] Configurando .env.local..."
cat > .env.local << EOF
DATABASE_URL="file:./data/app.db"
LICENSE_SERVER_URL="https://crmadmin.duckdns.org"
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="7d"
PORT=3000
HOST="0.0.0.0"
NODE_ENV="production"
EOF

# 6. Iniciar serviços
echo "[6/6] Iniciando serviços..."
pm2 start npm --name "crmgrafica" -- start 2>/dev/null || npx next start
pm2 save 2>/dev/null || echo "PM2 save pulado"

echo "=== Build concluído! ==="
echo "Acesse: http://localhost:3000"
echo "Admin: http://localhost:3000/setup"