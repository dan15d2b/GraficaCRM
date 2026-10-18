# CRMGráfica 2.0

Sistema de gestão comercial **ultra-seguro** focado exclusivamente em **Gráficas e Comunicação Visual**.

## 🎯 Foco do Nicho

O CRMGráfica 2.0 foi projetado para atender as necessidades específicas de:
- **Gráficas Rápidas** — serviço de impressão digital e offset
- **Comunicação Visual** — banners, lonas, adesivos, fachadas
- **Gráfica Offset** — produção em maior escala
- **Serviços Complementares** — design, Pré-pressa, acabamentos

## ✨ Funcionalidades Principais

### 1. Gestão de Produção
- Quadro Kanban de produção (Chegada → Impressão → Acabamento → QA → Retirada)
- Controle de chegada de arquivos
- Acompanhamento de prazos e SLA
- Gatilho automático "Pronto para Retirada" via WhatsApp

### 2. Atendimento via WhatsApp
- Inbox unificado com IA assistente
- Qualificação automática de pedidos
- Envio de orçamentos personalizados
- Aprovação de arte final digital

### 3. Agentes de IA Especializados
- **Atendimento Inicial** — primeiro contato e coleta de informações
- **Qualificação** — detalhamento técnico do pedido
- **Triagem de Arquivos** — análise técnica de arquivos para produção
- **Fechamento** — cálculo de orçamento e confirmação
- **Pós-Venda** — aviso de retirada e satisfação do cliente

### 4. Controle de Permissões Granular
- **Admin** — acesso total
- **Produção** — movimento de pedidos, sem acesso a financeiro/conversas
- **Financeiro** — contas, sem acesso a produção/conversas
- **Atendimento** — conversas e orçamentos
- **Vendas** — orçamentos e pedidos

### 5. Licenciamento e Segurança
- Chave de instalação obrigatória
- Validação online diária
- Bloqueio por inadimplência com aviso prévio
- Criptografia de dados sensíveis

### 6. Tema e Personalização
- Paleta padrão em **azul profissional** (#2563EB)
- Sem verde por padrão (conforme solicitação)
- Painel de customização de cores
- Temas claro e escuro

## 🚀 Como Rodar

```bash
cd crmgrafica-2.0

# Instalar dependências
pnpm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Rodar desenvolvimento
pnpm dev

# Rodar testes
pnpm test

# Build para produção
pnpm build
pnpm start
```

## 📊 Estrutura do Projeto

```
crmgrafica-2.0/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas públicas (login)
│   ├── (dashboard)/       # Rotas protegidas
│   └── api/               # APIs REST
├── components/             # Componentes React
│   ├── ui/                # Componentes base
│   ├── layout/            # Layout (sidebar)
│   └── license/           # Guard de licenciamento
├── lib/                    # Lógica de negócio
│   ├── navigation.ts      # Catálogo de navegação
│   ├── permissions.ts     # Matriz de permissões
│   ├── theme.ts          # Sistema de temas
│   ├── license.ts        # Módulo de licenciamento
│   └── ai-agents.ts      # Agentes especializados
├── supabase/migrations/   # Schema do banco
└── tests/                 # Testes automatizados
```

## 🔒 Segurança

- **Backend isolado**: toda lógica sensível no server
- **RLS (Row Level Security)**: isolamento cross-tenant
- **Criptografia**: dados sensíveis em trânsito e repouso
- **Validação Zod**: todo input externo é validado
- **Rate limiting**: proteção contra abuse

## 📞 Suporte

- Documentação: `docs/`
- Issues: GitHub Issues

---

**CRMGráfica 2.0** — O sistema operacional da sua gráfica.
