# Repository Guidelines

> Contrato portável para **qualquer** agente de código (Codex, Cursor, OpenCode, Antigravity, Copilot, Cline).
> Este arquivo é o núcleo. A **doutrina completa e não-negociável vive em [`CLAUDE.md`](CLAUDE.md)** —
> leia-o antes de tocar em código. O mapa de toda a documentação está em [`docs/index.md`](docs/index.md).
> Precedência quando dois documentos discordam: `CLAUDE.md` > `docs/specs/` > `docs/prd/` >
> `HANDOFF-*.md` > `README.md`.

## Project Overview

Sistema operacional de vendas open source com agentes de IA nativos, multi-nicho (e-commerce,
clínicas, imobiliárias, infoprodutos, serviços), WhatsApp como canal primário via WAHA, CRM
inteiro exposto por MCP. Multi-tenant com RLS desde o dia 1; LGPD nativa. Monetização =
**self-host em VPS**, não assinatura. Posicionamento: [`VISION.md`](VISION.md); estado real de
implementação: [`docs/current-state.md`](docs/current-state.md).

**Consequência que muda como você trabalha:** o produto é distribuído como código. Quem instala
numa VPS **é** o usuário. Uma mudança que funciona na máquina do dev e quebra no clone fresco é
**bug de produto**, não detalhe de ambiente. Nada que exija edição manual de arquivo na VPS entra.

Stack canônica (major; a versão exata é o `package.json`):

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 estrito · Tailwind 4 (config em CSS) ·
shadcn/ui (`new-york`) · Supabase (Postgres + Auth + Realtime + Storage) · Zod 4 · Vitest 4 ·
Playwright 1 · Sentry 11 · WAHA 2026.7.2 (engine NOWEB) · Upstash Redis · Vercel AI Gateway
(`@ai-sdk/anthropic|openai|google`).

> As majors acima são verificadas contra o `package.json` por
> [`tests/unit/agents-md-versoes.test.ts`](tests/unit/agents-md-versoes.test.ts) — declare **só a
> major**; afirmar minor em prosa cria débito que nenhum gate cobre e trava bump do Dependabot.
> Um teste irmão,
> [`tests/unit/documentacao-aponta-para-o-que-existe.test.ts`](tests/unit/documentacao-aponta-para-o-que-existe.test.ts),
> reprova todo path citado aqui que não exista no disco.

## Architecture & Data Flow

- **App** — Next.js 16 App Router: UI + Route Handlers no mesmo repo. Server Components por
  default; `"use client"` só com estado/evento/API de browser. Middleware de borda em `proxy.ts`
  (Next 16 renomeou `middleware.ts` → `proxy.ts`; ele injeta `X-Request-Id` e `x-pathname` e
  autentica a sessão antes da rota).
- **DB** — Supabase Postgres. RLS em toda tabela tenant-aware via helper
  (`fn_user_org_ids()`/`fn_user_role_in_org()`), a mesma função SECURITY DEFINER que o RBAC de
  aplicação usa. Schema versionado em `supabase/migrations/`; o que o self-host aplica é
  `supabase/baseline.sql`.
- **Auth** — Supabase Auth + `@supabase/ssr`, cookie `SameSite=Strict`. Sempre `getUser()` no
  server; **nunca** `getSession()`. MFA TOTP é opcional e ligado por quem administra
  (duas políticas que somam: plataforma e organização), regra pura em `lib/auth/politica-mfa.ts`.
- **Filas** — event sourcing leve: `event_log` + workers drenados por cron. Trigger Postgres
  **nunca** faz HTTP. Idempotência de worker: `unique (organization_id, external_id)` + captura de
  `code === '23505'`. Contrato completo em [`docs/specs/07-spec-events-workers.md`](docs/specs/07-spec-events-workers.md).
- **IA** — Vercel AI Gateway (Anthropic primário; embeddings pela OpenAI ou pelo Google, escolha da
  organização), RAG por tenant, guardrails before-send.
- **Tempo real** — Supabase Realtime (`postgres_changes` para inbox/kanban, `broadcast` para
  sinais leves). **Storage** — bucket privado `whatsapp-media`, URL assinada.

Fluxo de uma rota autenticada de tenant:

```mermaid
flowchart LR
  A[request] --> B[proxy.ts: X-Request-Id, sessao]
  B --> C[1. Zod valida input]
  C --> D[2. guard: requireRole / requirePlatformAdmin / secret]
  D --> E[3. organization_id de fonte confiavel]
  E --> F[4. query: RLS ou filtro manual de org]
  F --> G[5. audit se mutacao]
  G --> H[6. ok / fail]

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
