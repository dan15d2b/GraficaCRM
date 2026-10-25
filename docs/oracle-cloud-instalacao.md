# Instalar DeskcommCRM num Oracle Cloud VPS — Passo a passo

## O que você precisa antes de começar

- **Conta Oracle Cloud** com crédito gratuito ou plano pago ativo
- **Domínio** (ex.: `crm.suaempresa.com.br`) — pode comprar depois, mas precisa antes de colocar no ar
- **Conta Supabase** gratuita (supabase.com) — o instalador cria o projeto sozinho se você tiver o token

---

## Passo 1 — Criar a VPS no Oracle Cloud

1. Entre em [cloud.oracle.com](https://cloud.oracle.com) → **Compute** → **Instances** → **Create Instance**
2. **Nome**: `deskcomm` (ou o que preferir)
3. **Image**: **Ubuntu 22.04**
4. **Shape**: **VM.Standard.A1.Flex** (ARM/gratuito) ou **VM.Standard.E4.Flex** (x86)
   - Se usar ARM (A1): o kit já tem imagens WAHA ARM64 nativas — funciona sem problema
   - Se usar x86 (E4): padrão, também funciona
5. **Ocputadores**: mínimo **2 vCPU / 4 GB RAM** (WAHA + Postgres + app precisam disso)
6. **Network**: deixe a rede padrão (create virtual cloud network)
7. **Add SSH keys**: cole sua chave pública (`cat ~/.ssh/id_rsa.pub`) ou crie nova
8. **Firewall**: marque **"Assign a public IPv4 address"**
9. Clique **Create**

Anote o **IP público** que aparece na instância.

---

## Passo 2 — Configurar firewall (Security Lists)

Na página da instância, clique no **Subnet** → **Security List** associado → **Add Ingress Rules**:

| Type | Protocol | Source CIDR | Port |
|---|---|---|---|
| Custom TCP Rule | 6 (TCP) | 0.0.0.0/0 | 22 |
| Custom TCP Rule | 6 (TCP) | 0.0.0.0/0 | 80 |
| Custom TCP Rule | 6 (TCP) | 0.0.0.0/0 | 443 |

> O Oracle cria uma regra SSH por padrão; as portas 80 e 443 é que precisam ser abertas manualmente.

---

## Passo 3 — Conectar e preparar o servidor

```bash
# Acesse sua VPS (substitua pelo IP e usuário — Ubuntu usa 'ubuntu')
ssh ubuntu@<IP_PUBLICO>

# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale Docker se não estiver (o instalador instala se faltar, mas melhor prevenir)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Saia e entre de novo no SSH (ou rode isso) para o docker funcionar sem sudo
newgrp docker

# Confirme
docker --version
docker compose version
```

---

## Passo 4 — Configurar o domínio (DNS)

No painel do seu registrador de domínio (Cloudflare, Registro.br, GoDaddy, etc.):

1. Crie um registro **A** apontando `crm.suaempresa.com.br` → `<IP_PUBLICO_DA_VPS>`
2. Se usar **Cloudflare**, garanta que o **proxy está desligado** (nuvem cinza = DNS only) ou ligado (proxy) — ambos funcionam, mas o Claude Code guia preferencialmente com proxy desligado para facilitar diagnóstico
3. Espere a propagação (pode levar de 5 min a 24h):
   ```bash
   # Na VPS, confira
   getent ahosts crm.suaempresa.com.br
   ```

---

## Passo 5 — Obter token do Supabase

1. Entre em [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique no nome do projeto → **Settings** → **API**
3. Copie o **Project URL** e o **anon public** key
4. Vá em **Settings** → **Access Tokens** → **Create access token** (personal access token, não service role)
   - Token começa com `sbp_...`
   - **Anote também a connection string** com `pooler` (não a direct):
     - Vá em **Settings** → **Database** → **Connection string** → modo **Pooler** → copie

---

## Passo 6 — Baixar e rodar o instalador

```bash
# Clone o repositório
git clone --depth 1 https://github.com/melgarafael/DeskcommCRM.git deskcommcrm
cd deskcommcrm

# Rode o instalador interativo
bash hostgator-setup-kit/install.sh
```

O instalador vai pedir (em ordem):

1. **Endereço do repositório** — confirme `https://github.com/melgarafael/DeskcommCRM.git`
2. **Diretório de instalação** — confirme `/home/ubuntu/deskcommcrm`
3. **Token de acesso Supabase** (`sbp_...`) — o instalador cria o projeto sozinho
   - Ou informe URL + anon key + service role key + connection string se já tiver projeto
4. **Domínio** — ex.: `crm.suaempresa.com.br`
5. **Proxy reverso** — digite `caddy` (padrão, sobe Caddy automaticamente)
   - Se já tiver proxy (Traefik, Nginx próprio), informe `traefik` ou `npm`
6. **Provedor de IA** — `openrouter` (mais simples), `anthropic` (Claude, padrão), ou `openai`
7. **Chave da IA** — opcional no momento da instalação (dá para configurar depois)
8. **E-mail e senha do admin** — o primeiro usuário do CRM
9. **Aceitar telemetria** — opcional

O instalador também pergunta sobre **backup diário** — aceite (cria cron job).

---

## Passo 7 — Primeiro acesso

1. Aguarde ~2 minutos após o instalador terminar
2. Abra `https://<seu-dominio>`
3. Faça login com o e-mail e senha do admin
4. No onboarding, conecte o WhatsApp escaneando o QR code (aplique o app WAHA no celular em *Aparelhos conectados*)

---

## Passo 8 — Verificar se está tudo OK

```bash
bash hostgator-setup-kit/healthcheck.sh
```

Deve mostrar todos os serviços como `healthy`.

---

## Manter atualizado

Para atualizar quando sair versão nova:

```bash
cd ~/deskcommcrm
git pull origin main
bash hostgator-setup-kit/update.sh --yes
```

Ou atualize pela tela do CRM (menu → rodapé → "Nova versão").

---

## Troubleshooting rápido

| Problema | Solução |
|---|---|
| Site abre mas sem cadeado (HTTPS) | Espere 1-2 min; o Caddy gera o cert automaticamente. Se não resolver: `docker compose -f docker-compose.prod.yml restart caddy` |
| "Network unreachable" no banco | Use a connection string com **pooler** (não direct) |
| App reinicia em loop | `docker compose -f docker-compose.prod.yml logs app \| grep 'Falha de validação'` — diz qual variável falta no `.env` |
| Esqueci a senha do admin | `bash hostgator-setup-kit/reset-password.sh <seu@email>` |
| Preciso de ajuda | Entre na comunidade: [lp-comunidade.automatiklabs.com.br](https://lp-comunidade.automatiklabs.com.br) |
