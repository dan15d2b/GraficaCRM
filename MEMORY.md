# MEMÓRIA DO SISTEMA - CRM Gráfica 2.0

## 📋 PROCESSO DE DEPLOY - ARQUITETURA DUAL

### **Arquitetura da VPS (Servidor) - Principal**
- **Framework:** Next.js 16 App Router (Tudo na raiz)
- **Banco:** SQLite local 
- **Auth:** JWT + HttpOnly Cookies + validação de licença
- **Porta:** 3000 (configurable via .env.local)
- **Comando build:** `pnpm build` (na raiz do projeto)
- **Comando start:** `pnpm start` (na raiz do projeto)

### **Arquitetura Local/Desktop (Tauri)**
- **Framework:** React + Vite + Tauri
- **Banco:** SQLite via Rust/Tauri IPC
- **Auth:** JWT Local + Setup Wizard
- **Porta Backend:** 3001
- **Build:** `cargo tauri build` → gera .deb/.exe
- **frontendDist:** `../../frontend-node/dist`

---

## 🔧 CORREÇÕES EXECUTADAS

### 1. Corrigido `tauri.conf.json`
```json
{
  "build": {
    "beforeDevCommand": "pnpm --filter frontend-node dev",
    "beforeBuildCommand": "pnpm --filter frontend-node build",
    "frontendDist": "../../frontend-node/dist"
  }
}
```

### 2. Corrigido `backend/tsconfig.json` paths
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/lib/db/local": ["./src/lib/db/local.ts"],
    "@/lib/auth/local": ["./src/lib/auth/local.ts"],
    "@/lib/logger": ["./src/lib/logger.ts"],
    "@/lib/api/wrappers": ["./src/lib/api/wrappers.ts"],
    "@/lib/license/client": ["./src/lib/license/client.ts"],
    "@/lib/env": ["./src/lib/env.ts"]
  }
}
```

### 3. Build do backend concluído
```bash
pnpm --filter crmgrafica-backend build  # ✓ Sucesso
```

---

## 📁 ESTRUTURA CORRETA (sem workspaces)

```
GraficaCRM-main/
├── package.json              # Next.js monorepo (VPS) - build/start na raiz
├── backend/                  # Hono API (isolado, porta 3001) - separado
│   ├── src/server.ts        # Entry point
│   ├── src/lib/             # logger, env, db, auth, license
│   ├── src/routes/v1/       # API v1 endpoints
│   ├── package.json         # Scripts: build, start, dev
│   ├── vite.config.ts
│   └── dist/                # Build output
├── frontend-node/            # React + Vite (UI para Tauri) - separado
│   ├── src/                 # Componentes React
│   ├── dist/                # Build estático
│   ├── package.json
│   └── vite.config.ts
├── src-tauri/               # App Desktop (Rust) - separado
│   ├── src/commands/        # Rust IPC
│   ├── tauri.conf.json      # CORRIGIDO
│   └── Cargo.toml
├── app/                     # UI React + Next.js (na raiz, usado pela VPS)
├── lib/                     # Bibliotecas compartilhadas
├── admin-panel/             # Painel Admin VPS (separação futura)
└── .env.local               # Configuração (VPS usa na raiz)
```

---

## 🚀 COMANDOS PARA VPS (Servidor)

```bash
# Na raiz do projeto
pnpm install
pnpm build
pnpm start
# → http://localhost:3000

# Setup Wizard
http://localhost:3000/setup
```

## 🚀 COMANDOS PARA DESKTOP/LOCAL

```bash
# Backend isolado
cd backend
pnpm build
pnpm start  # http://localhost:3001

# Frontend para Tauri
cd ../frontend-node
pnpm build

# Tauri Desktop
cd ../src-tauri
cargo tauri build
# → target/release/bundle/debian/*.deb

# Dev Desktop
cargo tauri dev
```

---

## 📚 GUIAS ATUALIZADOS

- `docs/guia-VPS.md` - Instalação no servidor
- `docs/guia-local.md` - Instalação desktop/local
- `MEMORY.md` - Este arquivo (histórico)
- `AGENTS.md` - Regras e estrutura atualizadas
- `CLAUDE.md` - Regras de engenharia

---

## ⚠️ IMPORTANTE - NÃO usar workspaces

O projeto **não usa pnpm workspaces**. Todo o código Next.js está na raiz. Os diretórios `backend/` e `frontend-node/` são estruturas **paralelas** para o app Tauri Desktop.