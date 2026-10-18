# Guia — CRMGráfica no Zorin OS com DuckDNS

**Sistema operacional:** Zorin OS 17 (base Ubuntu 22.04)  
**Produto:** DeskcommCRM com marca e nicho **CRMGráfica**  
**Objetivo:** Rodar o CRM localmente e acessá-lo via domínio DuckDNS com HTTPS.  
**Tempo estimado:** 45–60 min (primeira vez).

> O motor é o DeskcommCRM (pasta raiz). A pasta `crmgrafica-2.0/` só traz a marca e o
> pacote de configuração de gráfica — não é um segundo servidor.

---

## O que você vai precisar

| Item | Versão | Observação |
|------|--------|------------|
| Node.js | ≥ 22 | |
| pnpm | qualquer | |
| Docker + Compose | ≥ 24 / ≥ 2.20 | |
| Conta DuckDNS | — | criar em 2 min |
| Projeto Supabase | grátis | Settings → API (ou stack 100% local) |

---

## Passo 1 — Conta DuckDNS

1. Acesse [https://www.duckdns.org](https://www.duckdns.org) e entre com Google/GitHub.
2. Em **Domain**, digite o subdomínio (ex.: `crmgrafica`) e clique em **Add Domain**.
3. Anote o **token**.

---

## Passo 2 — Cliente DuckDNS (atualiza o IP)

```bash
sudo mkdir -p /etc/duckdns

# TROQUE crmgrafica e SEU_TOKEN_AQUI
sudo tee /etc/systemd/system/duckdns.service <<'EOF'
[Unit]
Description=DuckDNS Dynamic DNS Update
After=network-online.target

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'curl -s "https://www.duckdns.org/update?domains=crmgrafica&token=SEU_TOKEN_AQUI&ip="'
EOF

sudo tee /etc/systemd/system/duckdns.timer <<'EOF'
[Unit]
Description=Run DuckDNS update every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
AccuracySec=1s
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now duckdns.timer
systemctl list-timers --all | grep duckdns
```

Confirme o DNS:

```bash
dig +short crmgrafica.duckdns.org
curl -s ifconfig.me
```

Os dois devem bater (IP público da sua casa/rede).

---

## Passo 3 — Nginx + HTTPS

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

sudo tee /etc/nginx/sites-available/crmgrafica <<'EOF'
server {
    listen 80;
    server_name crmgrafica.duckdns.org;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/crmgrafica /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

sudo certbot --nginx -d crmgrafica.duckdns.org
```

No roteador: encaminhe as portas **80** e **443** para o IP do Zorin na rede local.

---

## Passo 4 — Repositório e variáveis

Você já está neste clone. Na raiz:

```bash
cd ~/Área\ de\ trabalho/GraficaCRM-main

cp .env.example .env.local
```

Edite `.env.local` e preencha **no mínimo**:

```bash
# Supabase (Settings → API do projeto)
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
# Connection string: Session pooler em modo URI (não "Direct")
SUPABASE_DB_URL=postgresql://postgres.xxxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

INTERNAL_SECRET=   # openssl rand -hex 32
NEXT_PUBLIC_APP_URL=https://crmgrafica.duckdns.org
```

No painel Supabase → Authentication → URL Configuration:

- **Site URL:** `https://crmgrafica.duckdns.org`
- **Redirect URLs:** `https://crmgrafica.duckdns.org/**`

---

## Passo 5 — Marca CRMGráfica e stack

```bash
cd ~/Área\ de\ trabalho/GraficaCRM-main

bash crmgrafica-2.0/scripts/aplicar-marca.sh https://crmgrafica.duckdns.org
pnpm install
bash crmgrafica-2.0/scripts/subir-local.sh
```

Acompanhe:

```bash
pnpm local:logs
pnpm local:status
```

Quando a porta 3000 estiver ouvindo, abra:

```
https://crmgrafica.duckdns.org
```

Complete o **onboarding** (conta admin, organização, canal WhatsApp).

Bootstrap manual (instalação fresca, se precisar):

```bash
npx tsx scripts/bootstrap-owner.ts
```

---

## Passo 6 — Configurar o nicho gráfica

O wizard do onboarding **não** monta o funil de 10 colunas da gráfica (teto de 8).

1. Abra [`crmgrafica-2.0/pacote-grafica.md`](crmgrafica-2.0/pacote-grafica.md)
2. Em **Configurações › Funis**, crie as 10 colunas na ordem do pacote
3. **IA › Credenciais** → chave do provedor
4. **IA › Agentes** → cole o prompt do pacote (rascunho)
5. **IA › Follow-ups** → fluxo "Acompanhar orçamento"
6. Botão **Testar** → você clica em **Publicar**

Detalhes e checklist: o próprio `pacote-grafica.md`.

---

## Passo 7 — Verificar

```bash
curl -sI https://crmgrafica.duckdns.org | head -5
# Esperado: HTTP/2 200 (ou 307 em /app)

pnpm local:status
sudo nginx -t
```

---

## Troubleshooting

| Sintoma | O que fazer |
|---|---|
| Domínio não resolve | `dig +short crmgrafica.duckdns.org` vs `curl -s ifconfig.me`; checar timer DuckDNS |
| SSL falha | DNS apontando certo + portas 80/443 no roteador; `sudo certbot certificates` |
| App não sobe | `pnpm local:down && pnpm local:up`; logs com `pnpm local:logs` |
| WAHA offline | `docker ps \| grep -i waha`; logs do container |
| Login / e-mail | Site URL e Redirect URLs no Supabase Auth |
| `pnpm dev` em `crmgrafica-2.0/` | Recusado de propósito — use a raiz / scripts do kit |

---

## Manutenção

```bash
pnpm local:down
pnpm local:up
pnpm local:status
pnpm local:logs
```

Atualizar produto (quando houver versão nova):

```bash
git pull
# em VPS com kit oficial: bash hostgator-setup-kit/update.sh
```

---

## Notas

- Self-host: backup, segurança e IP/DNS são responsabilidade de quem opera.
- DuckDNS atualiza o IP a cada 5 minutos.
- Não use o Docker antigo dentro de `crmgrafica-2.0/` (arquivos `*.descontinuado`).
