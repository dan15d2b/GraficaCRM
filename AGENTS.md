# Repository Guidelines — CRM Gráfica 2.0

> Contrato portável para **qualquer** agente de código (Claude Code, Cursor, Cline, Roo Code, Codex).
> Este arquivo é o núcleo. A **doutrina completa e não-negociável vive em [`CLAUDE.md`](CLAUDE.md)** —
> leia-o antes de tocar em código. Qualquer doc antigo em `docs/` ou `.claude/skills/` que mencione Supabase está REVOGADO.

## Regras Invioláveis de Engenharia

1. **Explicar antes de agir:** Nunca crie, edite ou apague arquivos sem antes explicar tecnicamente a causa raiz ao usuário e listar os arquivos afetados.
2. **Zero Gambiarra (Solução Definitiva):** Proibido criar arquivos duplicados (`route-new.ts`, `db2.ts`), comentar código quebrado ou usar `any`/`@ts-ignore`. Corrija sempre na fonte canônica.
3. **Zero Loop:** Se um build ou teste falhar, pare imediatamente, leia o stack trace completo, identifique o conflito de import/tipo e explique antes de tentar outra abordagem.
4. **Preservação Visual e Funcional:** Proibido alterar telas, layout, componentes (`components/`, `app/globals.css`) ou regras de negócio do CRM.

## Project Overview & Arquitetura Alvo

Sistema operacional de vendas para gráficas e comunicação visual com agentes de IA nativos e WhatsApp via WAHA. A arquitetura é dividida em dois ambientes 100% independentes de Supabase/nuvem de terceiros:

1. **CRM Gráfica Local (Servidor do Cliente — Windows & Linux):**
   - Roda localmente com extrema fluidez usando banco de dados local leve e eficiente (Motor Rust / SQLite WAL / LibSQL) e storage em disco local.
   - **Setup Inicial na Instalação (Sem editar `.env`):** No primeiro acesso, abre tela de instalação pedindo a **Chave de Licença** (validada na VPS), **Usuário/Senha Admin Local** e **API Key dos Agentes de IA**, salvando tudo no banco local.
2. **Painel Admin & Servidor de Licenças (VPS AWS):**
   - Painel leve na VPS AWS com banco de dados local próprio (sem Supabase), responsável por criar licenças e autenticar os servidores locais dos clientes.
   - **Setup Inicial na VPS (Sem editar `.env`):** Na instalação/primeiro acesso na VPS, exige em tela a criação de **Usuário e Senha de Admin**, persistindo no banco local da VPS.

## Architecture & Data Flow

- **App** — Next.js 16 App Router (Turbopack) + React 19 + TypeScript 6 estrito + Tailwind 4 (CSS-first em `app/globals.css`) + shadcn/ui (`new-york`). Middleware de borda em `proxy.ts` (Next 16 renomeou `middleware.ts` → `proxy.ts`; injeta `X-Request-Id`, verifica se o Setup Inicial já foi concluído e valida a sessão local + licença ativa).
- **DB & Storage Local** — Persistência local de alta performance sem Supabase. Mantém todas as tabelas core (`organizations`, `users`, `crm_pipelines`, `crm_stages`, `crm_leads`, `crm_lead_activities`, `crm_lead_links`, `contacts`, `conversations`, `messages`, `api_audit_log`, `event_log`).
- **Auth** — Autenticação local via cookie `SameSite=Strict`, `HttpOnly` + tokens `Authorization: Bearer dsk_...` via `lib/api/auth-dual.ts`.
- **Filas** — Event sourcing leve via tabela local `event_log` + workers.
- **IA** — Agentes de IA configurados via chave de API inserida na instalação (armazenada localmente de forma segura).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
