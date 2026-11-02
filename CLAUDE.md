# CLAUDE.md — CRM Gráfica 2.0 (Tauri Desktop + Hono Backend + VPS Admin Panel)

> **LEITURA OBRIGATÓRIA ANTES DE QUALQUER AÇÃO.** Este arquivo é a autoridade máxima do projeto. Qualquer documentação antiga em `docs/` que mencione Supabase está **REVOGADA** por este documento.

---

## 1. REGRAS DE OURO DE ENGENHARIA (INVIOLÁVEIS)

1. **EXPLICAR ANTES DE EXECUTAR (REGRA #1):** Nunca crie, edite ou apague arquivos sem antes explicar tecnicamente a causa raiz ao usuário e listar os arquivos afetados.
2. **SOLUÇÃO TÉCNICA DEFINITIVA (PROIBIDO GAMBIARRA):** Nunca procure o caminho mais rápido/preguiçoso. É estritamente proibido:
   - Usar `@ts-ignore`, `@ts-expect-error` ou `any` para esconder erros.
   - Comentar blocos de código quebrados sem limpar as referências.
   - Criar arquivos paralelos (`arquivo-novo.ts`, `route2.ts`, `db-local-temp.ts`) em vez de consertar o arquivo canônico.
   - Retornar mocks ou dados falsos para simular funcionamento.
3. **PROTOCOLO ANTI-LOOP:** Se um comando de build ou inicialização falhar, **NÃO** tente rodar o mesmo comando de novo com um ajuste superficial. Leia o stack trace inteiro, rastreie a árvore de imports até a causa raiz, explique o erro tecnicamente para o usuário e corrija a origem.
4. **PRESERVAÇÃO VISUAL E FUNCIONAL:** Não altere telas, layout, componentes (`components/`, Tailwind 4 em `app/globals.css`) ou regras de negócio do CRM. Trabalho é **limpeza estrutural, remoção de arquivos duplicados, estabilização do banco local**.

---

## 2. ARQUITETURA CANÔNICA DO SISTEMA (ZERO SUPABASE)

O projeto foi migrado de Next.js para uma arquitetura híbrida:

### A. CRM Gráfica Desktop (Tauri + Hono Backend + SQLite Local)

- **Objetivo:** Aplicativo desktop para Windows/Linux com fluidez nativa.
- **Stack:** Tauri (Rust) + Hono (Backend API) + SQLite WAL (Banco Local) + React + Vite (UI)
- **Zero Supabase / Zero Cloud DB:** Nenhuma dependência de `@supabase/supabase-js`, `@supabase/ssr`, ou bancos externos.
- **Banco de Dados:** SQLite embutido via Hono backend + Rust/Tauri para desktop.
- **Autenticação Local + Validação de Licença:** JWT com cookie HttpOnly, validado contra VPS Admin Panel.

### B. Painel Admin e Servidor de Licenças (VPS AWS)

- **Objetivo:** Painel web para gerenciar licenças e clientes.
- **Stack:** Next.js App Router + Hono (API)
- **Banco de Dados Local na VPS:** SQLite local na VPS.

---

## 3. ESTRUTURA DE ARQUIVOS ATUALIZADA

```
backend/                 # Novo backend Hono
├─ src/                   # Código TypeScript do backend
├─ package.json          # Dependências (Hono, Zod, SQLite3, etc.)
├─ tsconfig.json         # TypeScript config
├─ server.ts             # Configuração server Hono
├─ vite.config.ts        # Build config
├─ data/                 # Pasta do banco SQLite
├─ dist/                 # Build output
└─ node_modules/

frontend-node/            # UI React + Vite (build estático para Tauri)
├─ src/                    # Componentes React
├─ index.html            # Entry point HTML
├─ vite.config.ts        # Build config
├─ package.json          # Dependências React
└─ dist/                 # Build output (consumido pelo Tauri)

src-tauri/                # Tauri Desktop App
├─ src/                   # Rust commands
├─ tauri.conf.json       # Tauri config (frontendDist: "../frontend-node/dist")
├─ Cargo.toml            # Rust dependencies
└─ icon/                 # Ícones da aplicação

admin-panel/              # Painel Admin VPS
├─ app/                   # Next.js App Router pages
├─ lib/                   # API clients, utils
├─ next.config.ts        # Next.js config
├─ package.json          # Dependências admin
└─

---

## 4. FLUXO DE INICIALIZAÇÃO (Setup Wizard)

### 4.1 Cliente Local (Tauri Desktop)
1. Usuário roda: ./crmgrafica (ou npm start)
2. Tauri abre janela WebView → http://localhost:3000
3. Se não há config.json → redireciona para /setup
4. Setup Wizard pede: Chave de Licença, Org, Admin, AI Keys
5. Dados salvos em: data/config.json, data/app.db
6. Marca setup como completo → acesso ao CRM

### 4.2 Painel Admin VPS
1. Primeiro acesso → /setup-admin
2. Cria Usuário e Senha Master
3. Acesso ao painel → CRUD de licenças, clientes, logs

---

## 5. MIDDLEWARE HONO (Substitui proxy.ts)

O novo `backend/src/middleware/` substitui o antigo `proxy.ts`:

```typescript
// backend/src/middleware/setup-gate.ts
export async function checkSetupGate(c: Context, next: Next) {
  const setupComplete = await db.query(
    "SELECT value FROM setup_status WHERE key = 'setup_complete'"
  );
  const done = setupComplete.rows[0]?.value === 'true';
  if (!done && !isSetupRoute(c.req.path)) {
    return c.json({ error: { code: 'setup_required' } }, 503);
  }
  return next();
}
```

---

## 6. COMANDOS PRINCIPAIS

```bash
# Cliente Local (Desktop)
pnpm dev          # Start backend dev (Hono + Vite hot reload)
pnpm build        # Build tudo
pnpm tauri dev    # Desenvolvimento Tauri
pnpm tauri build  # Build distribuição

# Admin VPS
cd admin-panel && pnpm dev
cd admin-panel && pnpm build
cd admin-panel && pnpm start

# Backend standalone
cd backend && pnpm dev
cd backend && pnpm start
```

---

## 7. MIGRAÇÃO: Próximos Passos

1. Criar `backend/package.json` e `backend/server.ts`
2. Migrar rotas de `app/api/v1/*` para `backend/src/routes/v1/`
3. Criar `frontend-node/` com React + Vite
4. Atualizar `tauri.conf.json` para apontar para `frontend-node/dist`
5. Criar `admin-panel/` com Next.js
