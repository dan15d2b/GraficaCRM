# 01-PLANO_ARQUITETURAL — CRM Gráfica Migration

> Documento de auditoria e planejamento. Atualizar conforme progresso.

---

## 1. Mapeamento de Módulos Atuais

### 1.1 CRM Leads / Funil (Kanban)
**Arquivos principais:**
- `app/app/kanban/` — UI do kanban
- `lib/leads/` — lógica de leads, agent-mapping
- `app/api/v1/leads/` — route handlers (172+ rotas)
- `supabase/migrations/` — ~17 migrations de pipeline/stage

**Tabelas relevantes:**
- `crm_pipelines` — funis (um por organização)
- `crm_stages` — etapas do funil
- `crm_leads` — cards/negócios
- `crm_lead_activities` — timeline de atividades
- `crm_lead_risk_states` — scoring de risco

**Campos atuais no lead:**
```sql
-- Campos comerciais
status (open/won/lost)
stage_id, pipeline_id
owner_id, owner_kind (user/ai)
value_cents, currency
lost_reason, lost_reason_category

-- Campos de produção (Wave 7/8)
producao_prioridade (baixa/normal/alta/urgente)
producao_status (na_fila/em_producao/concluido/entregue)
producao_sla_dias
producao_data_prevista
producao_responsavel (uuid)

-- Campos de arte
arte_status (pendente/aprovado/ajuste_solicitado)
arte_aprovado_por (uuid)
arte_observacoes (text)
```

**Extensões necessárias para gráfica:**
- Campo `tipo_servico` (text, enum ou jsonb)
- Badges visuais: prioridade, prazo, status follow-up
- Filtros por vendedor no topo do Kanban
- Pipeline pré-configurado "Produção" separado do "Comercial"

---

### 1.2 Follow-Ups
**Arquivos principais:**
- `lib/followup/` — motor de follow-ups
- `app/app/ai/followups/` — UI de gestão
- `lib/followup/modelos/` — templates por nicho

**Tabelas relevantes:**
- `followup_enrollments` — participantes ativos
- `followup_flow_pointers` — estado do flow
- `cron_jobs` — agendamentos (`kind = 'followup_turn'`)
- `followup_flows` — definição dos flows

**Gatilhos atuais:**
- Baseados em eventos do `event_log`
- Silêncio, no-show, abandono
- Extensível via graph-based flows (React Flow)

**Extensões necessárias:**
- Agendamento rápido no card (+2h, amanhã, +3d, +7d, personalizado)
- Categorização: WhatsApp, Ligação, Cobrança, Aprovação Arte, Pós-Venda
- Gatilhos automáticos em stages críticos
- Painel "Meu Dia" com ações rápidas

---

### 1.3 Event Sourcing / Workers
**Contrato:** `docs/specs/07-spec-events-workers.md`

**Tabelas:**
- `event_log` — registro de eventos
- `cron_jobs` — drenagem de workers

**Funcionamento:**
- INSERT na `event_log` via `emit_event()` (SECURITY DEFINER)
- Workers drenam eventos periodicamente
- Idempotência: `unique (organization_id, external_id)` + captura `code === '23505'`

---

### 1.4 Auth / RLS
**Funções críticas:**
- `fn_user_org_ids()` — resolve orgs do usuário
- `fn_user_role_in_org()` — resolve role
- Ambas SECURITY DEFINER

**Mechanismo:**
- Supabase Auth + `@supabase/ssr`
- Cookie SameSite=Strict, HttpOnly, Secure
- RLS em toda tabela tenant-aware

**Problema para migração Windows:**
- Supabase Auth não rodará localmente
- Solução: JWT próprio com `jose` (já dependency) + tabela `users` local
- Adaptar `@supabase/ssr` para cookie JWT customizado

---

### 1.5 WAHA / WhatsApp
**Configuração atual:**
- Container Docker separado
- Webhook URL configurável
- Engine NOWEB (mais leve, ~150MB)
- Storage de mídia via Supabase Storage

**Para Windows nativo:**
- Manter WAHA como serviço separado (binário Windows)
- Ou adaptar para usar biblioteca WhatsApp direta (node-whatsapp)
- Storage local em vez de Supabase Storage

---

### 1.6 IA / Agentes
**Tabelas:**
- `ai_agents`
- `ai_agent_versions`
- `ai_knowledge_*`
- `ai_invocations`

**Stack:**
---

## 2. Bugs, Falhas de Tipagem e Pontos de Atenção

### 2.1 Bugs Mapeados
| Problema | Severity | Localização |
|----------|----------|-------------|
| `: any` / `as any` (7 instâncias) | Medium | Vários arquivos lib/ |
| `pnpm test:db` exige Docker | High | CI/CD |
| Supabase Realtime em ambiente local | Medium | `lib/realtime/` |
| Conexões WebSocket órfãs | Low | Worker drain |

### 2.2 Pontos de Atenção Multi-Usuário LAN
1. **Realtime:** Supabase Realtime usa WebSocket — em ambiente local puro, precisa de adaptation (Redis pub/sub ou polling)
2. **Sessões:** Cookies SameSite=Strict funcionam bem em LAN, mas precisa garantir bind `0.0.0.0`
3. **Conexões órfãs:** Worker deve limpar sessões dead
4. **Rate limiting:** Upstash Redis substituir por Redis local ou memória

---

## 3. Arquivos para Rebranding DESCOMMCRM → CRM Gráfica

### 3.1 Nomes de Display/UI
- `package.json` description (já está `CRMGráfica 2.0`)
- `app/layout.tsx` — title, metadata
- `app/head.tsx` — metadados
- Componentes de branding: logos, favicons
- PWA manifest (`public/manifest.json`)

### 3.2 Documentos e Comentários
- `CLAUDE.md` — título e referências
- `README.md`
- `AGENTS.md`
- `docker-compose.yml` — container names
- `Dockerfile` — comentários

### 3.3 Strings fixas no código
- Labels de UI em `app/app/webhooks/_components/labels.ts`
- Mensagens de erro em `lib/errors.ts`
- Textos em skills/agents

### 3.4 NÃO alterar
- Nomes de tabelas no banco (manter compatibilidade)
- IDs de rotas (manter URLs)
- Nomes de variáveis internas (manter refactoring seguro)

---

## 4. Arquitetura Windows Nativa (Sem Docker)

### 4.1 Estrutura de Diretórios
```
C:\
├── Program Files\
│   └── CRM Grafica\
│       ├── node.exe
│       ├── server.js (Next.js standalone entry)
│       ├── .next\standalone\
│       │   ├── server.js
│       │   ├── packages\
│       │   └── ...
│       └── public\
│
└── ProgramData\
    └── CRMGrafica\
        ├── data\
        │   └── postgres\ (Postgres data dir)
        ├── logs\
        │   ├── app.log
        │   ├── worker.log
        │   └── postgres.log
        ├── backups\
        │   └── daily-YYYYMMDD.zip
        └── config\
            ├── .env
            └── winsw-app.xml
```

### 4.2 Serviços Windows
| Serviço | Binário | Porta | Descrição |
|---------|---------|-------|-----------|
| CRM Grafica App | `node.exe server.js` | 3000 | Next.js server |
| CRM Grafica Worker | `node.exe worker.js` | 8787 (health) | Event drain + cron |
| PostgreSQL | `pg_ctl` | 5432 | Banco local |
| WAHA (opcional) | `waha.exe` | 3030 | WhatsApp gateway |

### 4.3 WinSW Configuration
```xml
<service>
  <id>CRMGraficaApp</id>
  <name>CRM Gráfica - Aplicação</name>
  <description>Serviço principal do CRM Gráfica</description>
  <executable>C:\Program Files\CRM Grafica\node.exe</executable>
  <arguments>C:\Program Files\CRM Grafica\server.js</arguments>
  <log mode="roll"></log>
  <onfailure action="restart" delay="10 seconds"/>
  <onfailure action="restart" delay="20 seconds" count="2"/>
  <onfailure action="restart" delay="60 seconds"/>
</service>
```

### 4.4 Substituições de Containers
| Container Atual | Substituto Windows | Status |
|-----------------|-------------------|--------|
| Supabase Postgres | PostgreSQL local | Necessário migrar dados |
| Supabase Auth | JWT próprio + tabela users | Necessário implementar |
| Supabase Storage | FileSystem local | Necessário adaptar |
| Supabase Realtime | Redis local + broadcast | Necessário adaptar |
| WAHA Docker | WAHA Windows binary | Manter como serviço separado |
| Worker Docker | Processo Windows nativo | Direto |

### 4.5 PWA para Estações Cliente
- `public/manifest.json` atualizado
- Service Worker para cache
- Acesso via `http://<servidor>:3000`
- Instalação via navegador Chrome/Edge

---

## 5. Integração com "Vetor" (Futuro)

### 5.1 Endpoints Planeados
```
POST /api/v1/integration/vetor/clients
  - Recebe cliente do Vetor
  - Cria/atualiza contato + lead no Kanban
  - Gatilho de follow-up automático

POST /api/v1/integration/vetor/quotes
  - Recebe orçamento do Vetor
  - Vincula a lead existente ou cria novo
  - Move para stage "Orçamento Enviado"
```

### 5.2 Autenticação
- Token via header `X-Vetor-Token`
- Token armazenado em `.env` no servidor
- Validação em middleware de rota

### 5.3 Mock
- `tests/mocks/vetor-mock.ts` — simulador para testes locais

---

## 6. Roadmap de Execução

### Fase 1: Fundação (Passo 1 - CONCLUÍDO)
- [x] Criar memória do projeto
- [x] Auditoria completa
- [x] Plano arquitetural definido

### Fase 2: Rebranding e Saneamento (Passo 2)
- [ ] 2.1 Rebranding visual e textual
- [ ] 2.2 Correção de bugs e tipagem
- [ ] 2.3 Estabilidade multi-usuário

### Fase 3: Evolução dos Funis (Passo 3)
- [ ] 3.1 Estrutura de funis para gráfica
- [ ] 3.2 Motor de follow-ups avançado
- [ ] 3.3 Painel "Meu Dia"

### Fase 4: Windows Native (Passo 4)
- [ ] 4.1 Desacoplamento de containers
- [ ] 4.2 Serviços Windows + auto-recovery
- [ ] 4.3 LAN + firewall + PWA
- [ ] 4.4 Backup + instalador .exe

### Fase 5: Integração Vetor (Passo 5)
- [ ] 5.1 Contrato OpenAPI
- [ ] 5.2 Endpoints + mock

---

## 7. Arquivos de Referência

| Arquivo | Descrição |
|---------|-----------|
| `docs/current-state.md` | Estado atual do repo (auditoria 2026-07-29) |
| `docs/specs/07-spec-events-workers.md` | Contrato de eventos/workers |
| `supabase/baseline.sql` | Schema completo do banco |
| `supabase/migrations/` | 81 migrations (até 0092) |
| `CLAUDE.md` | Doutrina do projeto |
| `docker-compose.yml` | Stack Docker atual (dev only) |

---

> **Próximo passo:** Iniciar Sub-etapa 2.1 — Rebranding para CRM Gráfica
