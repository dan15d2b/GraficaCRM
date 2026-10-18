# Instalar o CRMGráfica (Deskcomm + nicho gráfica)

O binário que sobe é o DeskcommCRM da **raiz** do repositório. Esta pasta só aplica a marca e
o roteiro de gráfica.

## Pré-requisitos

- Node.js ≥ 22, pnpm, Docker + Compose
- Conta Supabase (plano grátis basta) **ou** stack local via Docker
- (Opcional) domínio DuckDNS + Nginx — veja o guia na raiz

## 1. Ambiente na raiz

```bash
cd "/caminho/para/GraficaCRM-main"

# Se ainda não tiver .env.local
cp .env.example .env.local
```

Preencha no mínimo (valores reais do projeto Supabase em Settings → API):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL` (Session pooler URI, se for nuvem)
- `INTERNAL_SECRET` — gere com `openssl rand -hex 32`
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` ou `https://seu.duckdns.org`

## 2. Marca CRMGráfica

```bash
cd crmgrafica-2.0
bash scripts/aplicar-marca.sh
```

Isso grava na raiz:

- `APP_NAME=CRMGráfica`
- `APP_ACCENT_HEX=#2563EB`
- `NEXT_PUBLIC_APP_URL` (se você passar o domínio)

## 3. Subir local

```bash
bash scripts/subir-local.sh
```

Equivalente manual na raiz:

```bash
pnpm install
pnpm local:up          # ou: bash scripts/local-stack.sh up
```

Acesse `http://localhost:3000` (ou o domínio) e complete o onboarding.

## 4. Configurar o nicho gráfica

Depois do onboarding (conta, WhatsApp WORKING, funil básico):

1. Abra [`pacote-grafica.md`](./pacote-grafica.md)
2. Monte o funil de **10 colunas** em **Configurações › Funis** (não pelo wizard)
3. Crie o agente, o follow-up de "Acompanhar" e a memória — tudo pela tela
4. Teste com o botão **Testar**; só então **Publique**

## 5. VPS / HostGator

Na VPS, use o kit oficial da raiz — não os scripts antigos desta pasta:

```bash
bash hostgator-setup-kit/install.sh
```

Quando perguntar o nome do app, responda **CRMGráfica**. Cor de destaque: `#2563EB`.
Depois aplique o [`pacote-grafica.md`](./pacote-grafica.md) pela tela.

## Credenciais

Não há e-mail/senha padrão. A conta nasce no onboarding ou via
`npx tsx scripts/bootstrap-owner.ts` na raiz (instalação fresca).
