# CRMGráfica — Tauri CI Builders

Pipeline de build dos pacotes desktop do CRMGráfica:
- `.deb` (Linux amd64) — Ubuntu 22.04
- `.exe` (Windows x64) — Windows 2022

## Estrutura

```
ci-builders/
├── tauri-build.yml       # Workflow do GitHub Actions
├── build-tauri.sh        # Script portátil de build
└── README.md             # Este arquivo
```

## Uso

### Rodar manualmente no GitHub Actions

Vá em **Actions → Tauri Builds → Run workflow** e selecione a branch.

Ou via CLI:
```bash
gh workflow run tauri-build.yml -f ref=master
```

### Configuração necessária no repositório

As seguintes secrets precisam estar configuradas (Settings → Secrets):

| Secret | Valor | Obrigatório |
|--------|-------|-------------|
| `GITHUB_TOKEN` | Automático | Não |
| `TAURI_SIGNING_PRIVATE_KEY` | Chave de assinatura (opcional) | Não |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Senha da chave (opcional) | Não |

### Branches que disparam o build

- `master` — build automático em push
- `releases/*` — build automático em push
- Manual — qualquer branch via UI ou `gh workflow run`

## Como funciona

### Linux (.deb)

1. Runner Ubuntu 22.04
2. Instala dependências do Tauri (`libwebkit2gtk-4.1-0`, `libgtk-3-0`, etc.)
3. Compila o binário Rust com cargo
4. Empacota com o script `src-tauri/build-deb.sh`
5. Upload do artefato `crmgrafica_<version>_amd64.deb`

### Windows (.exe)

1. Runner Windows 2022
2. Instala Rust + target `x86_64-pc-windows-gnu`
3. Compila com cargo
4. Cria bundle NSIS (.exe installer)
5. Upload do artefato `crmgraficaSetup_<version>.exe`

## Artefatos gerados

- `crmgrafica_0.1.0_amd64.deb` — instalador Linux (dpkg)
- `crmgraficaSetup_0.1.0_x64.exe` — instalador Windows (NSIS)

## Instalação local (Linux)

```bash
sudo dpkg -i crmgrafica_0.1.0_amd64.deb
# ou
sudo apt install ./crmgrafica_0.1.0_amd64.deb
```

## Instalação local (Windows)

Execute o `.exe` baixado do release.
