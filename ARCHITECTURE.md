# Architecture — CRM Gráfica 2.0 (Local Engine + VPS Licensing)

> Visão de 1 página da arquitetura limpa. A doutrina soberana vive em [`CLAUDE.md`](CLAUDE.md).

## Camadas do Sistema

- **App (Next.js 16 App Router)**: UI + Route Handlers no mesmo repositório. Server Components por default, Client onde precisa de estado. Middleware de borda em `proxy.ts` (Next 16 renomeou `middleware.ts` → `proxy.ts`).
- **DB Local (Cliente Windows/Linux & VPS Admin)**: Banco de dados 100% local, leve e embarcado (SQLite WAL / LibSQL / Motor em Rust), substituindo integralmente o Supabase. Mantém isolamento por `organization_id` e integridade relacional sem depender de nuvem externa.
- **Auth & Licenciamento**:
  - **No Servidor Local do Cliente:** Cookie HttpOnly (`SameSite=Strict`) validado localmente + verificação de licença ativa emitida pela VPS AWS.
  - **No Painel Admin (VPS AWS):** Autenticação local na VPS com credenciais de Admin criadas durante o Setup Inicial (sem edição manual de `.env`).
  - **MFA TOTP:** Opcional e gerenciado em Configurações › Segurança (`lib/auth/politica-mfa.ts`).
- **Storage Local**: Substitui o Supabase Storage. O bucket `whatsapp-media` opera em diretório local protegido no servidor do cliente, servido via rota autenticada.
- **WhatsApp (WAHA Plus / engine NOWEB)**: Webhooks HMAC-SHA512, throttle anti-banimento e STOP detection (`lib/opt-out/deteccao.ts`).
- **Filas (Event Sourcing Leve)**: Tabela local `event_log` + workers via cron (`workers/`).
- **Rate Limit**: Contador local em memória/SQLite (sem obrigar Upstash Redis externo).
- **AI (Agentes Nativos)**: Chaves de API (Anthropic, OpenAI, Google, OpenRouter) configuradas diretamente no Wizard de instalação inicial e salvas no banco local.

## Fluxo de Inicialização e Requisição (`proxy.ts`)

1. **Verificação de Setup Inicial (Boot Limpo)**:
   - Se o sistema ainda não foi configurado (primeiro acesso na VPS ou no Cliente Local), `proxy.ts` redireciona automaticamente para `/setup` (Wizard de Instalação), sem derrubar o app por falta de variáveis no `.env`.
   - **Na VPS AWS:** O Setup pede criação de Usuário e Senha do Admin Master.
   - **No Servidor Local (Windows/Linux):** O Setup pede a Chave de Licença (autenticando na VPS), Usuário/Senha do Admin Local e a API Key dos Agentes de IA.
2. **Rota Autenticada (`/api/v1/*`)**:
