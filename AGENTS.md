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

Sistema operacional de vendas para gráficas e comunicação visual com agentes de IA nativos e WhatsApp via WAHA. Arquitetura dividida em dois ambientes 100% independentes:

1. **CRM Gráfica Desktop (Servidor do Cliente — Windows & Linux):**
   - Tauri Desktop + Hono Backend + React + Vite + SQLite Local
   - **Setup Inicial:** Abre tela de instalação pedindo Chave de Licença, Usuário/Senha Admin Local e API Key dos Agentes de IA, salvando tudo localmente.

2. **Painel Admin & Servidor de Licenças (VPS AWS):**
   - Next.js App Router + Hono (API) + SQLite Local
   - Responsável por criar licenças e autenticar os servidores locais dos clientes.

## Architecture & Data Flow

- **Backend:** Hono (App Router-like middleware) + TypeScript + SQLite3 + better-sqlite3
- **Frontend UI:** React 19 + Vite 5 + Tailwind 4 + shadcn/ui
- **Desktop Runtime:** Tauri (Rust) + WebView
- **DB & Storage Local:** SQLite WAL mode, alta performance, sem Supabase
- **Auth:** JWT/HS256 com cookie HttpOnly SameSite=Strict, tokens `dsk_...`
- **Filas:** Event sourcing via tabela local `event_log` + workers
- **IA:** Agentes de IA configurados via chave de API inserida na instalação

## Estrutura de Arquivos

```
backend/                 # Backend Hono API (isolado, porta 3001)
├─ src/server.ts          # Entry point
├─ src/lib/               # logger, env, db, auth, license
├─ src/routes/v1/        # API v1 endpoints
├─ package.json         # "build": "tsc", "start": "tsx src/server.ts"
├─ vite.config.ts
└─ dist/                 # Build output

frontend-node/            # React + Vite (UI para Tauri)
├─ src/                   # React components
├─ index.html            # Entry point
├─ vite.config.ts
└─ dist/                 # Consumido pelo Tauri

src-tauri/                # Tauri Desktop (App Rust)
├─ src/commands/         # Rust IPC commands
├─ tauri.conf.json      # CORRIGIDO: frontendDist: "../../frontend-node/dist"
└─ Cargo.toml

admin-panel/              # Painel Admin VPS (Next.js separado)
app/                       # pages Next.js App Router
lib/                       # API clients, utils
└── ...

RAIZ DO PROJETO:
package.json              # Next.js monorepo (VPS)
.env.local                # Configuração
README.md                 # Documentação principal
docs/guia-VPS.md         # GUIA VPS
docs/guia-local.md       # GUIA LOCAL/DESKTOP
```

## 📚 DOCUMENTAÇÃO DE PROCESSOS

**SEMPRE atualizar estes arquivos após qualquer correção:**

1. **MEMORY.md** - Histórico de correções e soluções
2. **docs/guia-VPS.md** - Instalação no servidor
3. **docs/guia-local.md** - Instalação desktop/local
4. **AGENTS.md** - Regras e estrutura atualizadas

## ⚠️ SEPARAÇÃO DE AMBIENTES

- **VPS (Servidor):** `pnpm build` + `pnpm start` na raiz
- **Desktop (Local):** `pnpm --filter crmgrafica-backend build`, `cargo tauri build`

**NUNCA misture os builds** - cada ambiente tem sua própria estrutura de dependências!

<!-- END:tauri-agent-rules -->
