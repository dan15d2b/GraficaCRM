# CRMGráfica 2.0 — kit de nicho sobre o DeskcommCRM

O **CRMGráfica** não é mais um Next.js paralelo. O motor, o banco, o WhatsApp, a IA, o login
seguro e o deploy self-host são o **DeskcommCRM** (pasta raiz deste repositório).

Esta pasta é o **pacote de implantação para gráfica / comunicação visual**: marca, funil,
prompt, follow-ups e o roteiro de configuração pela tela.

```
GraficaCRM-main/          ← DeskcommCRM (produto)
├── app/, lib/, supabase/ ← código que sobe
├── hostgator-setup-kit/  ← instalador VPS
└── crmgrafica-2.0/       ← ESTE kit (marca + nicho gráfica)
    ├── pacote-grafica.md
    ├── INSTALL.md
    └── scripts/
```

## Por que mudou

O app mock anterior tinha login com senha no código, Docker incompleto e dados inventados no
dashboard. Usar o Deskcomm entrega, de fábrica:

- Auth real (Supabase) + papéis + auditoria
- WhatsApp via WAHA, anti-banimento, opt-out
- Agentes de IA com RAG, follow-ups e funil
- RLS multi-tenant e kit de instalação VPS

## Começar agora

1. Leia [`INSTALL.md`](./INSTALL.md) — sobe o Deskcomm com a marca CRMGráfica.
2. Depois do onboarding, abra [`pacote-grafica.md`](./pacote-grafica.md) e configure pela tela
   (funil de 10 colunas, agente, follow-up de orçamento).
3. Em Zorin + DuckDNS: use o guia na raiz
   [`../GUIA-INSTALACAO-ZORIN-DUCKDNS.md`](../GUIA-INSTALACAO-ZORIN-DUCKDNS.md).

Atalho local (a partir desta pasta):

```bash
bash scripts/aplicar-marca.sh   # grava APP_NAME / cor no .env.local da raiz
bash scripts/subir-local.sh     # sobe a stack Deskcomm (Docker + app)
```

## O que NÃO fazer

- Não rode `pnpm dev` dentro de `crmgrafica-2.0/` — o app mock foi descontinuado
  (veja [`MOCK-DESCONTINUADO.md`](./MOCK-DESCONTINUADO.md)).
- Não use o `docker-compose.yml` antigo desta pasta — o compose válido é o da raiz.
- Não monte o funil de 10 colunas pelo wizard do onboarding (teto de 8). Monte em
  **Configurações › Funis**, como está no pacote.
