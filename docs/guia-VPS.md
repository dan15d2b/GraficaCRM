# Guia de Instalação - VPS (Servidor)

## 🎯 OBJETIVO
Instalar o CRM Gráfica 2.0 como servidor web na VPS com Next.js 16 + SQLite local.

---

## 📋 REQUISITOS NA VPS

- Ubuntu 22.04+ ou Debian 12+
- Node.js 22+
- pnpm 9.x
- 4GB RAM mínimo
- Docker (opcional, mas recomendado)

---

## 🔧 PASSO A PASSO

### 1. Conectar na VPS
```bash
ssh -i caminho/para/crm.pem ubuntu@IP_DA_VPS
```

### 2. Instalar Node.js 22 (se não tiver)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node --version  # deve mostrar 22.x
```

### 3. Instalar pnpm
```bash
npm install -g pnpm@9
pnpm --version  # deve mostrar 9.x
```

### 4. Clonar o projeto
```bash
git clone https://github.com/dan15d2b/GraficaCRM.git
cd GraficaCRM
```

### 5. Instalar dependências
```bash
pnpm install
```

### 6. Configurar .env
```bash
cp .env.example .env.local
nano .env.local
```

**Configurações IMPORTANTES no .env.local:**
```
LICENSE_SERVER_URL="https://licencas.graficacrm.com"
JWT_SECRET="[gerar: openssl rand -hex 32]"
PORT=3000
HOST="0.0.0.0"
NODE_ENV="production"
```

### 7. Build
```bash
pnpm build
```

### 8. Iniciar (modo produção)
```bash
pnpm start
```

### 9. Verificar funcionamento
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Abrir no navegador
http://IP_DA_VPS:3000/setup
```

---

## 🐧 INSTALAÇÃO COM DOCKER (opcional)

```bash
# Build imagem
docker build -t crmgrafica:v2.0 .

# Run container
docker run -d -p 3000:3000 --name crmgrafica \
  -v /dados/crm:/app/data \
  -v /caminho/.env.local:/app/.env.local \
  crmgrafica:v2.0
```

---

## 📊 MONITORAMENTO

```bash
# Ver logs
docker logs -f crmgrafica

# Ver processos
ps aux | grep node

# Ver portas
netstat -tulnp | grep 3000
```

---

## 🔄 ATUALIZAÇÃO

```bash
# Baixar novos commits
git pull origin main

# Rebuild
pnpm build

# Reiniciar
pm2 restart crmgrafica  # se usar pm2
# ou
# mata o processo e roda pnpm start
```