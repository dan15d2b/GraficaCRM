# GraficaCRM 2.0 — Guia de Instalação

## Requisitos do Sistema

### Servidor (VPS)
- **CPU:** 2+ cores
- **RAM:** 4GB mínimo (8GB recomendado)
- **Armazenamento:** 20GB mínimo
- **Sistema Operacional:** Ubuntu 20.04+, Debian 11+, ou macOS 12+
- **Rede:** Porta 80/443 abertas, domínio apontando para o servidor

### Máquina Local (Desenvolvimento)
- **CPU:** 2+ cores
- **RAM:** 8GB mínimo
- **Armazenamento:** 10GB
- **Sistema Operacional:** Windows 10+, macOS 12+, Linux

---

## Instalação Rápida (5 minutos)

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/graficacrm.git
cd graficacrm
```

### 2. Execute o instalador
```bash
chmod +x install.sh
./install.sh
```

### 3. Configure o ambiente
O instalador vai:
- Criar arquivo `.env.local` baseado no `.env.example`
- Gerar segredos automaticamente
- Instalar todas as dependências
- Fazer build de todos os módulos

### 4. Inicie os serviços

**Modo Desenvolvimento:**
```bash
bash scripts/dev.sh
```

**Modo Produção:**
```bash
bash scripts/prod.sh
```

### 5. Acesse o sistema
- **Frontend:** http://localhost:1420 (dev) ou http://seu-dominio.com (prod)
- **Admin:** http://localhost:4000
- **Setup inicial:** http://localhost:1420/setup

---

## Configuração do Supabase

O GraficaCRM usa Supabase como banco de dados. Para configurar:

### Opção A: Supabase Cloud (Recomendado)
1. Crie uma conta em https://supabase.com
2. Crie um novo projeto
3. Copie as credenciais:
   - `Project URL`: https://xyz.supabase.co
   - `anon public key`: eyJhbG...
   - `service_role key`: eyJhbG...
4. Adicione ao `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### Opção B: Supabase Local
```bash
# Instale o Supabase CLI
npm install -g supabase

# Inicie localmente
supabase start

# Copie as credenciais de .env
supabase status
```

---

## Configuração do WhatsApp (WAHA)

### 1. Obtenha uma API Key
Acesse https://waha.devlikeapro.com/ e gere uma API key.

### 2. Configure no `.env.local`
```bash
WAHA_API_KEY=sua_chave_aqui
WAHA_HOOK_BASE_URL=http://seu-dominio.com
```

### 3. Gere o hash SHA512
```bash
echo -n "$WAHA_API_KEY" | sha512sum
# Adicione o hash em:
WAHA_API_KEY_SHA512=hash_gerado
```

### 4. Inicie o WAHA
```bash
docker compose up -d
```

### 5. Conecte o número
Acesse http://localhost:3030/dashboard/ e escaneie o QR Code.

---

## Configuração de IA

### Anthropic (Claude)
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### OpenAI
```bash
OPENAI_API_KEY=sk-...
```

### OpenRouter (multi-model)
```bash
OPENROUTER_API_KEY=sk-or-...
```

### Google AI
```bash
GOOGLE_API_KEY=AIza...
```

---

## Deploy para VPS (Ubuntu)

### 1. Prepare o servidor
```bash
# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale pré-requisitos
sudo apt install -y curl git docker.io docker-compose

# Adicione usuário ao grupo docker
sudo usermod -aG docker $USER

# Habilite o Docker
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. Configure Nginx (SSL)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Configure o domínio
sudo nano /etc/nginx/sites-available/graficacrm
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;
    
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Gere o certificado SSL
```bash
sudo certbot --nginx -d seu-dominio.com
```

### 4. Configure PM2 para monitoramento
```bash
sudo npm install -g pm2

# Crie arquivo de configuração
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'graficacrm-backend',
    script: 'pnpm',
    args: 'start',
    cwd: './backend',
    env: {
      NODE_ENV: 'production',
    },
  }, {
    name: 'graficacrm-admin',
    script: 'pnpm',
    args: 'start',
    cwd: './admin-panel',
    env: {
      NODE_ENV: 'production',
    },
  }]
};
