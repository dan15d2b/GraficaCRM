# CLAUDE.md — CRM Gráfica (Arquitetura Local + Licensing Server VPS)

> **LEITURA OBRIGATÓRIA ANTES DE QUALQUER AÇÃO.** Este arquivo é a autoridade máxima do projeto. Qualquer documentação antiga em `docs/` que mencione Supabase, Upstash ou deploy antigo via GHCR está **REVOGADA** por este documento.

---

## 1. REGRAS DE OURO DE ENGENHARIA (INVIOLÁVEIS)

1. **EXPLICAR ANTES DE EXECUTAR (REGRA #1):** Você é proibido de sair alterando, criando ou apagando arquivos em silêncio. Antes de qualquer mudança, apresente ao usuário:
   - O diagnóstico exato (qual arquivo está causando conflito/erro e por quê).
   - O que você vai fazer (quais arquivos serão apagados, unificados ou editados).
   - Aguarde confirmação quando a mudança envolver exclusão de arquivos duplicados ou mudança estrutural.
2. **SOLUÇÃO TÉCNICA DEFINITIVA (PROIBIDO GAMBIARRA):** Nunca procure o caminho mais rápido/preguiçoso. É estritamente proibido:
   - Usar `@ts-ignore`, `@ts-expect-error` ou `any` para esconder erros.
   - Comentar blocos de código quebrados sem limpar as referências.
   - Criar arquivos paralelos (`arquivo-novo.ts`, `route2.ts`, `db-local-temp.ts`) em vez de consertar o arquivo canônico.
   - Retornar mocks ou dados falsos para simular funcionamento.
3. **PROTOCOLO ANTI-LOOP:** Se um comando de build ou inicialização falhar, **NÃO** tente rodar o mesmo comando de novo com um ajuste superficial. Leia o stack trace inteiro, rastreie a árvore de imports até a causa raiz, explique o erro tecnicamente para o usuário e corrija a origem.
4. **PRESERVAÇÃO ABSOLUTA DE UI E FERRAMENTAS:** Não altere o design, componentes visuais (`components/`, Tailwind 4 em `app/globals.css`), fluxos de tela, funis de Kanban, agentes de IA ou ferramentas de negócio do CRM. O trabalho é **limpeza estrutural, remoção de arquivos duplicados/órfãos, estabilização do banco local e fluxo de instalação/licenciamento**.

---

## 2. ARQUITETURA CANÔNICA DO SISTEMA (ZERO SUPABASE)

O projeto passou por migrações e possui arquivos duplicados/residuais do Supabase que precisam ser higienizados. A arquitetura oficial é dividida em dois módulos independentes e enxutos:

### A. CRM Gráfica — Servidor Local do Cliente (Windows & Linux)
- **Objetivo:** Rodar 100% localmente na máquina/servidor do cliente com fluidez nativa no Windows e no Linux.
- **Zero Supabase / Zero Cloud DB:** Nenhuma dependência de `@supabase/supabase-js`, `@supabase/ssr`, Supabase Auth, Supabase Storage ou Supabase Realtime deve permanecer ativa no runtime.
- **Banco de Dados e Motor Local:** Banco de dados 100% local, leve, embarcado e de alta velocidade (Motor em Rust / SQLite nativo em modo WAL / LibSQL), mantendo integridade relacional das tabelas do CRM sem exigir que o cliente instale SGBDs pesados ou crie contas na nuvem.
- **Storage Local:** Mídias do WhatsApp (`whatsapp-media`) e arquivos salvos diretamente no sistema de arquivos local estruturado do servidor do cliente, servidos por rota interna autenticada.
- **Autenticação Local + Validação de Licença:** Sessão local com JWT/Cookie HttpOnly assinado localmente, porém condicionada à validação da licença ativa junto ao **Painel Admin na VPS**.
- **Setup Wizard no Primeiro Acesso (Sem editar `.env`):**
  - Ao subir o sistema pela primeira vez sem configuração, o sistema NÃO deve cair com erro em `lib/env.ts`. Ele deve redirecionar para uma tela de **Setup/Instalação Inicial**.
  - Essa tela pede: **Chave de Licença** (validada na VPS), **Credenciais do Admin Local** e **Chave de API dos Agentes de IA** (Anthropic / OpenAI / Google).
  - Esses dados são salvos de forma segura no banco/configuração local (criptografados), eliminando a necessidade de editar `.env` manualmente.

### B. Painel Admin e Servidor de Licenças (VPS AWS)
- **Objetivo:** Painel de controle super leve hospedado na VPS AWS para gerar, gerenciar, bloquear e autenticar as licenças dos servidores locais dos clientes.
- **Banco de Dados Local na VPS:** Usa banco local próprio na VPS (sem Supabase, sem bancos externos pagos).
- **Setup Inicial do Admin na Instalação (Sem editar `.env`):**
  - Na instalação/primeiro acesso na VPS, o sistema exibe o formulário/prompt de criação de **Usuário e Senha do Administrador Master**, gravando o hash seguro direto no banco local da VPS.

---

## 3. PRESERVAÇÃO DO CORE DO CRM (NÃO QUEBRAR)

Ao limpar arquivos duplicados e consolidar o banco local, mantenha intactos os contratos internos do sistema:

- **Frontend:** Next.js App Router + React 19 + TypeScript estrito + Tailwind 4 CSS-first (`app/globals.css` — não criar `tailwind.config.ts`) + shadcn/ui.
- **Padronização de API (`/api/v1/`):**
  - Manter wrappers `ok()` e `fail()` de `lib/api/wrappers.ts` e códigos de `lib/api/errors.ts`.
  - Manter formato JSON snake_case, UUID v4, valores monetários em `_cents`.
- **Modelagem Core do CRM:**
  - Tabelas principais preservadas: `organizations`, `users`, `crm_pipelines`, `crm_stages`, `crm_leads`, `crm_lead_activities`, `crm_lead_links`, `contacts`, `conversations`, `messages`, `api_audit_log`, `event_log`.
  - Manter `position_in_stage` numérico (fractional indexing) nos leads do Kanban.
- **WhatsApp (WAHA):**
  - Manter integração com WAHA (engine NOWEB), webhook HMAC SHA512, regras de anti-banimento (throttle/jitter, janela de disparo) e detecção de opt-out (`lib/opt-out/deteccao.ts`).
- **White-label / Marca Própria:**
  - Manter resolvedores em `lib/branding/instalacao.ts` e `lib/branding/saida.ts` lendo do banco local sem nunca lançar erro 500.

---

## 4. DIRETRIZ DE LIMPEZA E DESDUPLICAÇÃO

1. **Unificação de Clientes de Banco/Auth:** Se houver múltiplos adaptadores de banco (ex: `lib/supabase/*` brigando com `lib/db/*` ou código em Rust/SQLite), mantenha um **único ponto de entrada canônico** e redirecione ou atualize os imports de forma limpa, apagando o código morto.
2. **Desativação de `lib/env.ts` bloqueante no boot:** Variáveis que agora são preenchidas na tela de instalação (API de IA, Senha Admin, Licença) não podem derrubar o processo Node/Rust antes da tela de Setup abrir.
3. **Remoção de Testes Cercas Obsoletos:** Testes em `tests/` que existem apenas para obrigar o uso de Supabase (`baseline-no-piso-do-postgres.test.ts`, invariantes de RLS do PostgREST/Supabase) devem ser limpos ou adaptados para a nova arquitetura local.
