# GraficaCRM 2.0 — Instalação Desktop

## 📦 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    DESKTOP APP (Tauri)                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)                                    │
│       ↓ WebView                                             │
│  Backend (Hono + SQLite Local)                              │
│       ↓ Banco Local                                          │
│  SQLite (.crmgrafica.db)                                    │
└─────────────────────────────────────────────────────────────┘
         ↓ Validacao
┌─────────────────────────────────────────────────────────────┐
│                 VPS ADMIN PANEL (Next.js)                   │
│         /api/admin/licenses                                  │
│         /api/admin/setup                                     │
└─────────────────────────────────────────────────────────────┘
```

**NENHUM BANCO CLOUD NECESSÁRIO!** O SQLite fica local no computador do cliente.

---

## 🪟 Windows — Instalação (.exe)

### Pré-requisitos
- Windows 10 ou superior
- 4GB RAM mínimo
- 1GB espaço em disco

### Instalação

**Opção 1: Download direto**
```bash
# Baixe o instalador:
# https://seu-dominio.com/download/crmgrafica-setup.exe

# Execute como administrador
crmgrafica-setup.exe
```

**Opção 2: Build local**
```bash
# Instale Rust:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Clone o projeto
git clone https://github.com/seu-usuario/graficacrm.git
cd graficacrm

# Build
cd build
bash build-desktop.sh

# O .exe estará em:
# src-tauri/target/release/bundle/nsis/crmgrafica_2.0.0_amd64-setup.exe
```

### Primeira Execução
1. Execute `CRM Gráfica` no menu Iniciar
2. O Setup Wizard vai abrir automaticamente
3. Preencha:
   - **Chave de Licença** (obtida no painel admin)
   - **Nome da Organização**
   - **Email e Senha do Admin**
   - **API Keys de IA** (Anthropic/OpenAI/OpenRouter)
4. O banco SQLite será criado em:
   ```
   C:\Users\SEU_USUARIO\.crmgrafica\app.db
   ```

---

## 🐧 Linux — Instalação (.deb)

### Pré-requisitos
- Ubuntu 20.04+ / Debian 11+ / Fedora 38+
- 4GB RAM mínimo
- 1GB espaço em disco
- Bibliotecas: `libwebkit2gtk-4.1-0`, `libgtk-3-0`

### Instalação via .deb

```bash
# Baixe o pacote:
wget https://seu-dominio.com/download/crmgrafica_2.0.0_amd64.deb

# Instale:
sudo dpkg -i crmgrafica_2.0.0_amd64.deb

# Se faltar dependências:
sudo apt-get install -f

# Execute:
crmgrafica
```

### Instalação via Repositório (opcional)

```bash
# Adicione o repositório:
echo "deb https://repo.seu-dominio.com/apt stable main" | sudo tee /etc/apt/sources.list.d/crmgrafica.list

# Importe a chave GPG:
curl -fsSL https://repo.seu-dominio.com/gpg.key | sudo apt-key add -

# Instale:
sudo apt update
sudo apt install crmgrafica
```

---

## 🍎 macOS — Instalação (.app)

### Pré-requisitos
- macOS 12.0 (Monterey) ou superior
- 4GB RAM mínimo
- Apple Silicon (M1/M2) ou Intel

### Instalação
```bash
# Baixe o .dmg:
# https://seu-dominio.com/download/crmgrafica.dmg

# Monte e arraste para Applications:
hdiutil attach crmgrafica.dmg
cp -R /Volumes/crmgrafica/crmgrafica.app /Applications/
hdiutil detach /Volumes/crmgrafica

# Primeira execução (pode pedir permissão):
o penapps/crmgrafica.app
```

---

## ⚙️ Configuração do Banco Local

O SQLite é criado automaticamente no primeiro setup. Localização:

| Sistema | Caminho |
|---------|---------|
| **Windows** | `%USERPROFILE%\.crmgrafica\app.db` |
| **Linux** | `~/.crmgrafica/app.db` |
| **macOS** | `~/Library/Application Support/br.com.crmgrafica/app.db` |

### Backup do Banco
```bash
# Linux/macOS
cp ~/.crmgrafica/app.db ~/backup/crmgrafica-backup-$(date +%Y%m%d).db

# Windows (PowerShell)
Copy-Item "$env:USERPROFILE\.crmgrafica\app.db" "$env:USERPROFILE\backup\crmgrafica-backup-$(Get-Date -Format yyyyMMdd).db"
```

---

## 🔗 Integração com VPS Admin

Para validar licenças, o desktop app se conecta ao painel admin na VPS:

```bash
# Configuração no Setup Wizard:
LICENSE_SERVER_URL=https://admin.seu-dominio.com
```

Se a VPS não estiver disponível, o app funciona offline (licença armazenada localmente).

---

## 📱 WhatsApp (WAHA)

### Opção 1: WAHA em Docker (Recomendado)

```bash
# Na VPS ou máquina local:
docker compose up -d waha

# Acesse o dashboard:
http://localhost:3030/dashboard/

# Escaneie o QR Code com o WhatsApp
```

### Opção 2: WAHA Plus (Nuvem)

1. Assine em https://waha.devlikeapro.com/
2. Pegue a API key
3. Adicione no Setup Wizard

---

## 🤖 Configuração de IA

No Setup Wizard, insira pelo menos uma das chaves:

| Provedor | Variável | Exemplo |
|----------|----------|---------|
| Anthropic | `ANTHROPIC_API_KEY` | `sk-ant-api03-...` |
| OpenAI | `OPENAI_API_KEY` | `sk-...` |
| OpenRouter | `OPENROUTER_API_KEY` | `sk-or-...` |
| Google | `GOOGLE_API_KEY` | `AIza...` |

---

## 🔧 Solução de Problemas

### Erro: "SQLite database locked"
```bash
# Verifique se não há outra instância rodando
ps aux | grep crmgrafica

# Reinicie o serviço
sudo systemctl restart crmgrafica
```

### Erro: "Setup Wizard não abre"
```bash
# Verifique os logs
journalctl -u crmgrafica -f

# Ou execute manualmente
~/Applications/crmgrafica.app/Contents/MacOS/crmgrafica
```

### Erro: "Falha na validação da licença"
```bash
# Verifique a conexão com a VPS
curl -I https://admin.seu-dominio.com/api/admin/licenses

# Ou desative a validação (modo offline)
export CRMGRAFICA_SKIP_LICENSE_VALIDATION=1
```

---

## 📦 Especificações do Pacote

### Windows (.exe)
- Tamanho: ~85MB
- Instalador: NSIS
- Instalação em: `C:\Program Files\CRM Gráfica`
- Start Menu: CRM Gráfica

### Linux (.deb)
- Tamanho: ~92MB
- Dependências: libwebkit2gtk-4.1, libgtk-3
- Instalação em: `/opt/crmgrafica`
-ícone: `/usr/share/applications/crmgrafica.desktop`

### macOS (.app)
- Tamanho: ~78MB
- Código: Assinado (codesign)
- Instalação: `/Applications/crmgrafica.app`

---

## 🚀 Próximos Passos

Após instalar:
1. Execute o CRM Gráfica
2. Complete o Setup Wizard
3. Conecte o WhatsApp (WAHA)
4. Configure os agentes de IA
5. Comece a vender! 🎉

---

**Suporte:** docs/ ou issues no repositório
