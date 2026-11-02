#!/bin/bash
# =============================================================================
# GRAFICACRM 2.0 — Script de Instalação
# =============================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          GRAFICACRM 2.0 — Setup Inicial                    ║${NC}"
echo -e "${BLUE}║          Sistema para Gráficas e Comunicação Visual         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Passo 1: Verificar pré-requisitos
echo -e "${YELLOW}[1/5] Verificando pré-requisitos...${NC}"

for cmd in node pnpm docker docker-compose; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}ERRO: $cmd não encontrado.${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"
echo -e "${GREEN}✓ Docker $(docker --version)${NC}"
echo ""

# Passo 2: Configurar .env.local
echo -e "${YELLOW}[2/5] Configurando variáveis de ambiente...${NC}"

if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✓ Arquivo .env.local criado${NC}"
fi

# Gerar segredos se necessário
if ! grep -q "INTERNAL_SECRET=[^ ]" .env.local 2>/dev/null; then
    sed -i "s|^INTERNAL_SECRET=.*|INTERNAL_SECRET=$(openssl rand -hex 32)|" .env.local
    echo -e "${GREEN}✓ INTERNAL_SECRET gerado${NC}"
fi

echo ""

# Passo 3: Instalar dependências
echo -e "${YELLOW}[3/5] Instalando dependências...${NC}"

# Carregar ambiente Node.js se necessário
if ! command -v node &> /dev/null; then
    export PATH="$HOME/.nvm/versions/node/v$(node --version 2>/dev/null | cut -d'v' -f2)/bin:$PATH" 2>/dev/null || true
fi

cd backend && pnpm install && cd ..
cd frontend-node && pnpm install && cd ..
cd admin-panel && pnpm install && cd ..
pnpm install

echo -e "${GREEN}✓ Dependências instaladas${NC}"
echo ""

# Passo 4: Build
echo -e "${YELLOW}[4/5] Construindo projetos...${NC}"

cd backend && pnpm build && cd ..
cd frontend-node && pnpm build && cd ..
cd admin-panel && pnpm build && cd ..

echo -e "${GREEN}✓ Builds concluídos${NC}"
echo ""

# Passo 5: Iniciar
echo -e "${YELLOW}[5/5] Iniciando serviços...${NC}"
echo ""
echo -e "${BLUE}Para desenvolvimento:${NC}"
echo "  bash scripts/dev.sh"
echo ""
echo -e "${BLUE}Para produção:${NC}"
echo "  bash scripts/prod.sh"
echo ""

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                     SETUP CONCLUÍDO!                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
