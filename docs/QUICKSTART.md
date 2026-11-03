# GraficaCRM 2.0 — Quickstart

## 🚀 Primeiros Passos (5 minutos)

### 1. Build do Desktop App

```bash
# No diretório raiz do projeto:
bash build/build-desktop.sh
```

**Output:**
- Windows: `src-tauri/target/release/bundle/nsis/crmgrafica_2.0.0_amd64-setup.exe`
- Linux: `src-tauri/target/release/bundle/deb/crmgrafica_2.0.0_amd64.deb`
- macOS: `src-tauri/target/release/bundle/macos/crmgrafica.app`

---

### 2. Distribuição

**Windows (.exe):**
```bash
# Envie o arquivo para o cliente
# Ele executa e segue o assistente
```

**Linux (.deb):**
```bash
# Envie o pacote para o cliente
scp crmgrafica_2.0.0_amd64.deb usuario@servidor:~/

# Cliente instala:
sudo dpkg -i crmgrafica_2.0.0_amd64.deb
```

**macOS (.app):**
```bash
# Compacte e envie
tar -czf crmgrafica.tar.gz src-tauri/target/release/bundle/macos/crmgrafica.app

# Cliente instala:
tar -xzf crmgrafica.tar.gz
mv crmgrafica.app /Applications/
```

---

### 3. Primeiro Uso (Setup Wizard)

Quando o cliente executar o app pela primeira vez:

1. **Tela de Setup** abre automaticamente
2. Preencha:
   - Chave de Licença (gerada no painel admin)
   - Nome da Organização
   - Email + Senha do Admin
   - API Key da IA (Anthropic/OpenAI/OpenRouter)
3. **Banco SQLite** é criado automaticamente em:
   - Windows: `%USERPROFILE%\.crmgrafica\app.db`
   - Linux: `~/.crmgrafica/app.db`
   - macOS: `~/Library/Application Support/br.com.crmgrafica/app.db`

---

### 4. WhatsApp (Opcional)

Para ativar WhatsApp:

```bash
# Opção A: WAHA local (Docker)
docker compose up -d waha

# Opção B: WAHA Plus (nuvem)
# Adicione a API key no Setup Wizard
```

---

## 📁 Estrutura de Arquivos Gerados

```
src-tauri/target/release/bundle/
├── deb/
│   └── crmgrafica_2.0.0_amd64.deb      # Linux
├── nsis/
│   └── crmgrafica_2.0.0_amd64-setup.exe  # Windows
└── macos/
    └── crmgrafica.app                  # macOS
```

---

## 🔑 Dados do Cliente (SQLite Local)

O banco fica NO COMPUTADOR DO CLIENTE:

```sql
-- Tabela: organizations
-- Tabela: users
-- Tabela: licenses
-- Tabela: contacts
-- Tabela: leads
-- Tabela: conversations
-- etc...
```

**NENHUM DADO VAI PARA NUvem!** Tudo fica local.

---

## 🌐 Painel Admin VPS (Opcional)

Para gerenciar licenças de múltiplos clientes:

```bash
# Deploy do painel admin
cd admin-panel
pnpm install
pnpm build
pnpm start

# Acesse:
http://seu-dominio.com
```

---

## 📞 Suporte

- Docs: `docs/INSTALLATION_DESKTOP.md`
- Troubleshooting: `docs/` 
- Issues: GitHub (quando disponível)
