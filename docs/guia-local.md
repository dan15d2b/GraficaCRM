# Guia de Instalação - Local/Desktop (Tauri)

## 🎯 OBJETIVO
Instalar o CRM Gráfica 2.0 como aplicativo desktop nativo (Windows/Linux) com Tauri + Hono + SQLite.

---

## 📋 REQUISITOS

### Linux
- Ubuntu 22.04+ ou Debian 12+
- Node.js 22+
- pnpm 9.x
- Rust/Cargo 1.80+
- GTK 3 development libs
- Build essentials

### Windows
- Windows 10/11
- Node.js 22+ (Windows x64)
- pnpm 9.x
- Rust/Cargo 1.80+
- Visual Studio Build Tools

### macOS
- macOS 13+ (Sonoma)
- Node.js 22+
- pnpm 9.x
- Rust/Cargo 1.80+
- Xcode Command Line Tools

---

## 🛠️ INSTALAÇÃO DE DEPENDÊNCIAS

### Linux - Dependências de sistema
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl git build-essential
sudo apt install -y libgtk-3-dev libgdk-pixbuf-xlib-2.0-dev libasound2-dev libx11-dev libsqlite3-dev

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env
rustc --version  # deve mostrar 1.x
```

### Node.js e pnpm
```bash
# nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# pnpm
npm install -g pnpm@9
pnpm --version
```

---

## 🔧 PASSO A PASSO

### 1. Clonar o projeto
```bash
git clone https://github.com/dan15d2b/GraficaCRM.git
cd GraficaCRM
```

### 2. Instalar dependências
```bash
pnpm install
```

### 3. Build do Backend
```bash
pnpm --filter crmgrafica-backend build
```

### 4. Build do Frontend
```bash
pnpm --filter frontend-node build
```

### 5. Configurar .env.local
```bash
cp .env.example .env.local
nano .env.local
```

**Configurações IMPORTES no .env.local:**
```
LICENSE_SERVER_URL="https://licencas.graficacrm.com"
JWT_SECRET="[gerar: openssl rand -hex 32]"
PORT=3001
HOST="0.0.0.0"
NODE_ENV="production"
```

### 6. Build do .deb (Linux) ou .exe (Windows)

**Linux (.deb):**
```bash
cd src-tauri
cargo tauri build
```

**Windows (.exe):**
```bash
cd src-tauri
cargo tauri build
```

**Resultado:** `target/release/bundle/debian/*.deb` ou `target/release/bundle/msi/*.msi`

### 7. Instalar localmente
**Linux:**
```bash
sudo dpkg -i target/release/bundle/debian/crmgrafica_2.0.0_amd64.deb
```

**Windows:**
- Duplicar o .msi e instalar

### 8. Executar o app
```bash
crmgrafica  # ou abrir via menu/área de trabalho
```

O app abrirá em http://localhost:3000 (Setup Wizard)

---

## 🚧 DESENVOLVIMENTO

### Rodar modo desenvolvimento
```bash
# Terminal 1: Backend
cd backend
pnpm start  # http://localhost:3001

# Terminal 2: Tauri Dev
cd src-tauri
cargo tauri dev
```

O app abrirá no modo desenvolvimento.

---

## 📁 ESTRUTURA DE ARQUIVOS

```
GraficaCRM/
├── backend/              # Hono API (porta 3001)
│   ├── src/server.ts    # Entry point
│   └── src/lib/         # logger, env, db, auth, license
├── frontend-node/        # React + Vite UI
│   ├── src/             # Componentes React
│   └── dist/            # Build estático
├── src-tauri/           # App Rust
│   ├── src/             # Commands Rust
│   ├── tauri.conf.json  # Configuração
│   └── Cargo.toml       # Dependências Rust
└── admin-panel/         # Painel Admin (separado)
```

---

## 🔧 TROUBLESHOOTING

### Erro: "EADDRINUSE"
```bash
# Porta 3000 ocupada
lsof -i :3001
kill -9 PID

# Ou mudar porta no .env.local
PORT=3002
```

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Erro: "command not found: cargo"
```bash
source $HOME/.cargo/env
cargo --version
```