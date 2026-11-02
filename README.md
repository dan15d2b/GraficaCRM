<div align="center">

🇧🇷 Português · [🇺🇸 English](README.en.md)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo-grafica-crm.svg">
  <img src="public/logo-grafica-crm.svg" alt="CRM Gráfica" width="420">
</picture>

# 📦 CRM Gráfica 2.0 — Sistema Desktop Tauri

**🚀 Arquitetura moderna: Tauri Desktop + Hono Backend + SQLite Local**

Sistema de gestão completo para pequenas e médias empresas com:
- **App Desktop nativo** (Tauri + React)
- **Backend API local** (Hono + SQLite)
- **Zero Supabase** — 100% local
- **Setup Wizard** com validação de licença

[![Tauri](https://img.shields.io/badge/Tauri-2.0-black?logo=tauri)](https://tauri.app)
[![Hono](https://img.shields.io/badge/Hono-API-black)](https://hono.dev)
[![SQLite](https://img.shields.io/badge/SQLite-local-blue?logo=sqlite)](https://sqlite.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

---

## 📥 Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/dan15d2b/GraficaCRM.git
cd GraficaCRM

# 2. Instale dependências
pnpm install

# 3. Build do backend
cd backend && pnpm build

# 4. Build do frontend
cd ../frontend-node && pnpm build

# 5. Build do app Tauri (Desktop)
cd ../src-tauri && pnpm tauri build
```

> ⚠️ **Prerequisites (Linux)**: Node.js 20+, pnpm, Rust/Cargo, Tauri build dependencies

---

## 🚀 Executando o Sistema

### Opção 1: Desktop (Recomendado)

```bash
# Build e executar Tauri
cd src-tauri
cargo tauri dev
```

Abra `http://localhost:3000` — o **Setup Wizard** configurará automaticamente:
- Chave de licença (validada na VPS admin)
- Credenciais do admin local
- Chaves de API de IA

### Opção 2: Desenvolvimento

```bash
# Terminal 1: Backend API
cd backend
pnpm dev  # http://localhost:3001

# Terminal 2: Tauri dev
cd src-tauri
cargo tauri dev
```

---

## 📁 Estrutura do Projeto

```
GraficaCRM/
├── backend/                    # API Hono + SQLite (porta 3001)
│   ├── src/
│   │   ├── server.ts          # Entry point
│   │   ├── middleware/        # Setup gate, logging
│   │   ├── routes/v1/         # API endpoints
│   │   └── lib/
│   ├── package.json
│   └── vite.config.ts
├── frontend-node/              # React + Vite (UI)
│   ├── src/
│   ├── index.html
│   └── vite.config.ts
├── src-tauri/                  # App Desktop (Rust)
│   ├── src/
│   ├── tauri.conf.json
│   └── Cargo.toml
├── admin-panel/                # Painel Admin (Next.js)
│   └── app/
└── docker-compose.yml          # Docker (opcional)
```

---

## ☁️ Painel Admin (VPS)

```bash
cd admin-panel
pnpm install
pnpm dev      # http://localhost:4000
```

### Funcionalidades:
- Gestão de Licenças
- Monitoramento de Clientes
- Logs de Atividade
- Configurações

---

## 🔐 Autenticação

- **JWT Local** (HS256 com tokens `dsk_...`)
- **Cookies HttpOnly** para sessão
- **Validação de Licença** via HTTP para VPS admin

---

## 🐛 Problemas Comuns

### `EADDRINUSE` - Porta em uso
```bash
# Backend usa porta 3001 por padrão
# Altere em backend/src/server.ts ou exporte PORT=3002
```

### Backend não inicia
```bash
# Verifique node version >= 20
node --version
# Reinstale dependências
pnpm install
```

---

## 📄 Licença

MIT — veja [LICENSE](LICENSE)

---

## 🤝 Contribuindo

Este projeto é **100% open source** para a comunidade brasileira. Contribuições são bem-vindas!

Antes de abrir PR:
1. Leia o [CLAUDE.md](CLAUDE.md)
2. Siga o padrão de código declarado
3. Execute: `pnpm typecheck && pnpm lint && pnpm build`

**Definition of Done:**
- `typecheck` zero
- `lint` zero  
- Build bem-sucedido
- Testes relevantes verdes (se aplicável)

---

<div align="center">

**Feito com ❤️ no Brasil**

</div>
# GraficaCRM