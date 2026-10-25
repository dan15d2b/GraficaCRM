# Instalação do CRMGráfica 2.0 na VPS Oracle Cloud (Free Tier)

Guia passo a passo para subir o sistema numa VPS Oracle Cloud.
Dados do Supabase e da API de IA são inseridos **durante a instalação**, não antes.

---

## 1 — O que você precisa ter antes de começar

| Item | Onde conseguir |
|---|---|
| **VPS Oracle Cloud (grátis ou paga)** | console.cloud.oracle.com → Compute → Instâncias → Criar instância |
| **Domínio** | Registro.br, GoDaddy, Cloudflare etc. (ex.: `crm.suaempresa.com.br`) |
| **Chave SSH** | Gerada no momento da criação da instância pela Oracle |
| **Nada mais** — Supabase e IA entram depois |

> **Recomendação:** use a instância **grátis** (Ampere A1, 4 OCPU, 24 GB RAM).
>architecture ARM64 é suportada nativamente.

---

## 2 — Configurar a VPS na Oracle Cloud

### 2.1 Criar a instância

1. Acesse **console.cloud.oracle.com** → **Compute** → **Instâncias**
2. Clique em **Criar instância**
3. Preencha:
   - **Nome**: `crm`
   - **Reserva de compartimento**: o padrão
   - ** rede e armazenamento**: padrão (seleciona subnet e FG corretos)
   - **Imagem**: **Ubuntu 22.04** ou **Oracle Linux 9**
   - **Tipo de máquina**: **VM.Standard.A1.Flex** (ARM / Ampere)
   - **OCPUs**: 1, **Memória**: 6 GB (o mínimo que funciona bem)
   - **SSL**: padrão
4. Faça upload da **chave SSH** ou gere uma nova
5. Clique em **Criar**

### 2.2 Liberar portas no Security List

A Oracle vem com o firewall do cloud bloqueando tudo exceto SSH.

1. Na página da instância, clique no **Security List** vinculado
2. Clique em **Adicionar regras de entrada**
3. Adicione estas três regras:

| Protocolo | Porta | Fonte |
|---|---|---|
| TCP | 22 | 0.0.0.0/0 |
| TCP | 80 | 0.0.0.0/0 |
| TCP | 443 | 0.0.0.0/0 |

4. Clique em **Adicionar regras de entrada**

### 2.3 Anotar o IP público

Na página da instância, copie o **Endereço IP Público**.
Anote ele — vamos precisar nos passos seguintes.

---

## 3 — Acessar a VPS por SSH

Abra o terminal do seu computador e conecte-se:

```bash
ssh -i /caminho/para/sua-chave.pem opc-user@<IP-PÚBLICO>
```

- **Ubuntu** → use `ubuntu` como usuário
- **Oracle Linux** → use `opc-user` como usuário
- Se o terminal pedir permissão para a chave: digite `yes` e Enter

Você verá algo como:
```
[ubuntu@ip-10-0-0-5 ~]$
```

---

## 4 — Preparar a VPS (um comando só)

Execute **todos** estes comandos dentro da VPS (SSH):

```bash
# Atualiza o sistema
sudo apt update && sudo apt upgrade -y

# Instala Docker + Docker Compose
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Reinicia o shell para o docker funcionar sem sudo
newgrp docker
```

Confira que deu certo:

```bash
docker --version && docker compose version
```

---

## 5 — Clone o repositório e inicie a instalação

```bash
# Sobe para a pasta home
cd ~

# Clona o CRM (último release, apenas os arquivos necessários)
git clone --depth 1 https://github.com/melgarafael/DeskcommCRM.git deskcommcrm
cd deskcommcrm

# Inicia o instalador interativo
bash hostgator-setup-kit/install.sh
```

---

## 6 — O instalador vai fazer perguntas

### 6.1 — Escolha da IA

O instalador pergunta qual provedor de IA você quer usar.
Digite o número:

- **[1]** OpenRouter — uma chave, centenas de modelos (recomendado para começar)
- **[2]** Anthropic (Claude) — o padrão do Enter, o melhor nas ferramentas do CRM
- **[3]** OpenAI — GPT

> Se pular (Enter), usa **Anthropic** como padrão.

### 6.2 — Token do Supabase (ou credenciais)

O instalador pede o **token de acesso pessoal** do Supabase:
`supabase.com/dashboard/account/tokens`

Com esse token, o instalador **cria o projeto sozinho** e preenche tudo.

> Sem token? Ele pede as 4 credenciais manualmente (Project URL, anon key,
> service_role key e a connection string **Session pooler URI** — nunca a "Direct").

### 6.3 — Chave da IA

O instalador pede a chave do provedor escolhido.
Pode pular (Enter) e cadastrar depois em **IA › Credenciais** na tela do CRM.

### 6.4 — Domínio e e-mail do admin

- **DOMAIN**: o domínio completo, ex. `crm.suaempresa.com.br` (sem `https://`)
- **OWNER_EMAIL**: e-mail do primeiro administrador
- **OWNER_PASSWORD**: senha (mínimo 8 caracteres)

### 6.5 — Conferência

O instalador mostra uma tela numerada com todas as respostas.
Confira, corrija se necessário digitando o número, e confirme com **s**.

---

## 7 — Configurar o DNS do domínio

### 7.1 — Descobrir o IP da VPS

Dentro da VPS, rode:

```bash
curl -s https://api.ipify.org
```

Anote o IP.

### 7.2 — Criar o registro A no domínio

Vá ao painel do seu registrador de domínio e crie um registro **A**:

| Tipo | Nome | Valor |
|---|---|---|
| A | `crm` (ou deixe vazio para o domínio raiz) | `<IP-da-VPS>` |

**Cloudflare**: deixe a nuvem **cinza** (DNS only). A laranja esconde o IP.

### 7.3 — Conferir se o DNS já valeu

Dentro da VPS:

```bash
getent ahosts crm.suaempresa.com.br | awk '{print $1}' | sort -u
```

Se aparecer o IP da VPS, o DNS já propagou. Pode demorar de 5 min a 2h.

---

## 8 — Finalizar a instalação

### 8.1 — Rodar o instalador novamente (para ler o DNS)

Volte ao instalador:

```bash
cd ~/deskcommcrm
bash hostgator-setup-kit/install.sh
```

Na tela de conferência, ele confere o DNS. Se ainda não propagou, aperte **Enter**
para ele esperar e reconfirmar.

### 8.2 — Aguardar o cadeado

O instalador sobe todos os contêineres. Aguarde a mensagem:
```
✅ Instalação concluída!
```

Abra `https://<seu-dominio>` no navegador.
Os primeiros segundos pode mostrar "Não seguro" — o certificado SSL está sendo
emitido. Aguarde 1-2 minutos e atualize.

---

## 9 — Primeiro acesso

1. Abra `https://<seu-dominio>`
2. Entre com o **OWNER_EMAIL** e a **OWNER_PASSWORD**
3. Preencha o onboarding (nome da empresa, o que faz, fuso horário)
4. Conecte o WhatsApp: abra o app no celular em **Aparelhos conectados** e
   escaneie o QR que aparecer na tela (o QR vale poucos minutos)

---

## 10 — Dicas pós-instalação

### Backup diário
```bash
crontab -e
# Adicione:
0 3 * * * cd ~/deskcommcrm && bash hostgator-setup-kit/backup.sh
```

### Atualizar
Pela tela: menu → rodapé → "Nova versão" → "Atualizar agora"
Ou manual:
```bash
cd ~/deskcommcrm
bash hostgator-setup-kit/update.sh
```

### Verificar saúde
```bash
bash hostgator-setup-kit/healthcheck.sh
```

---

## Problemas comuns na Oracle Cloud

| Sintoma | Causa | Solução |
|---|---|---|
| Site abre mas sem cadeado | DNS ainda não propagou | Espere; rode `getent ahosts <domínio>` |
| Conexão recusada | Security List bloqueando 80/443 | Volte em 2.2 e adicione as regras |
| Container reiniciando em loop | Falta variável de ambiente | `docker compose -f docker-compose.prod.yml logs app \| grep '\[env\]'` |
| "Network unreachable" no banco | Connection string errada | Use a **Session pooler URI**, nunca a "Direct" |
| "esqueci minha senha" com link quebrado | Site URL do Supabase não configurado | `export SUPABASE_ACCESS_TOKEN=... && bash hostgator-setup-kit/marca-emails.sh` |

---

*Este guia cobre instalação padrão. Para casos especiais (proxy existente,
instalação para cliente, customização), consulte `.agents/skills/deskcomm-instalar/SKILL.md`.*
