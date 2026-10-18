/**
 * CRMGráfica 2.0 — Registro de Navegação (Focado em Gráficas)
 */

export type NavGroupId = "atendimento" | "producao" | "crm" | "financeiro" | "ia" | "configuracoes";

export interface NavGroup {
  id: NavGroupId;
  label: string;
  hub?: { href: string; label: string };
}

export interface NavDestination {
  href: string;
  label: string;
  description: string;
  icon: string;
  group: NavGroupId;
  section?: string;
  minRole?: string;
  sidebar?: boolean;
}

export const NAV_GROUPS: NavGroup[] = [
  { id: "atendimento", label: "Atendimento" },
  { id: "producao", label: "Produção", hub: { href: "/app/producao", label: "Ver tudo em Produção" } },
  { id: "crm", label: "Pedidos", hub: { href: "/app/pedidos", label: "Ver tudo em Pedidos" } },
  { id: "financeiro", label: "Financeiro", hub: { href: "/app/financeiro", label: "Ver tudo em Financeiro" } },
  { id: "ia", label: "Inteligência Artificial" },
  { id: "configuracoes", label: "Configurações", hub: { href: "/app/configuracoes", label: "Configurações" } },
];

export const NAV_DESTINATIONS: NavDestination[] = [
  // ATENDIMENTO
  { href: "/app/inbox", label: "Conversas", description: "WhatsApp, chat e histórico de atendimento.", icon: "Inbox", group: "atendimento", section: "Canal principal", sidebar: true },
  { href: "/app/prospect", label: "Novos Orçamentos", description: "Leads e solicitações de orçamento pendentes.", icon: "ClipboardText", group: "atendimento", section: "Canal principal" },
  { href: "/app/approvals", label: "Aprovações de Arte", description: "Arte final aguardando aprovação do cliente.", icon: "Flag", group: "atendimento", section: "Fluxo de produção" },

  // PRODUÇÃO
  { href: "/app/producao/kanban", label: "Quadro de Produção", description: "Acompanhe cada serviço do orçamento à entrega.", icon: "Kanban", group: "producao", section: "Gestão de produção", sidebar: true },
  { href: "/app/producao/orcamentos", label: "Orçamentos", description: "Lista de orçamentos criados e seus status.", icon: "FileText", group: "producao", section: "Gestão de produção" },
  { href: "/app/producao/chegada", label: "Chegada de Arquivo", description: "Triagem e recebimento de arquivos para produção.", icon: "PaperPlaneTilt", group: "producao", section: "Fluxo de produção" },
  { href: "/app/producao/impressao", label: "Em Impressão", description: "Serviços em andamento na gráfica.", icon: "Printer", group: "producao", section: "Fluxo de produção" },
  { href: "/app/producao/acabamento", label: "Em Acabamento", description: "Corte, laminação, encolhimento e outros acabamentos.", icon: "Scissors", group: "producao", section: "Fluxo de produção" },
  { href: "/app/producao/controle-qualidade", label: "Controle de Qualidade", description: "Inspeção de qualidade antes da entrega.", icon: "ShieldCheck", group: "producao", section: "Fluxo de produção" },
  { href: "/app/producao/pronto-retirada", label: "Pronto para Retirada", description: "Serviços finalizados, aguardando retirada ou entrega.", icon: "CheckCircle", group: "producao", section: "Fluxo de produção", sidebar: true },
  { href: "/app/producao/entregues", label: "Entregues", description: "Histórico de serviços entregues.", icon: "Check", group: "producao", section: "Fluxo de produção" },
  { href: "/app/producao/agenda", label: "Agenda de Produção", description: "Grade de produção, filas e prazos.", icon: "CalendarBlank", group: "producao", section: "Gestão de produção" },

  // CRM
  { href: "/app/clientes", label: "Clientes", description: "Cadastro completo de clientes e histórico.", icon: "Users", group: "crm", section: "Cadastros", sidebar: true },
  { href: "/app/pedidos", label: "Pedidos", description: "Todos os pedidos em andamento e concluídos.", icon: "ClipboardText", group: "crm", section: "Pedidos", sidebar: true },
  { href: "/app/cotacoes", label: "Cotações", description: "Orçamentos enviados e convertidos em pedidos.", icon: "Calculator", group: "crm", section: "Pedidos" },
  { href: "/app/catalogo", label: "Catálogo de Produtos", description: "Lona, adesivo, banner, fachada, cartão, etc.", icon: "Package", group: "crm", section: "Cadastros" },
  { href: "/app/fornecedores", label: "Fornecedores", description: "Cadastro de fornecedores de insumos.", icon: "Truck", group: "crm", section: "Cadastros" },

  // FINANCEIRO
  { href: "/app/financeiro/caixa", label: "Caixa", description: "Fluxo de caixa diário e fechamento.", icon: "Wallet", group: "financeiro", section: "Operações", sidebar: true },
  { href: "/app/financeiro/contas-receber", label: "Contas a Receber", description: "Financeiro separado por prazo e status.", icon: "ArrowCircleDown", group: "financeiro", section: "Operações" },
  { href: "/app/financeiro/contas-pagar", label: "Contas a Pagar", description: "Despesas e compromissos financeiros.", icon: "ArrowCircleUp", group: "financeiro", section: "Operações" },
  { href: "/app/financeiro/faturamento", label: "Faturamento", description: "Notas fiscais e resumo financeiro.", icon: "Receipt", group: "financeiro", section: "Relatórios" },
  { href: "/app/financeiro/relatorios", label: "Relatórios Financeiros", description: "DRE, fluxo de caixa e métricas de desempenho.", icon: "ChartBar", group: "financeiro", section: "Relatórios" },

  // IA
  { href: "/app/ia/agentes", label: "Agentes de IA", description: "Configure agentes para atendimento e qualificação.", icon: "Robot", group: "ia", section: "Agentes" },
  { href: "/app/ia/base-conhecimento", label: "Base de Conhecimento", description: "FAQ, procedimentos e catálogos para a IA.", icon: "BookOpen", group: "ia", section: "Agentes" },
  { href: "/app/ia/prompts", label: "Prompts Especializados", description: "Prompt de orçamento, aprovação de arte, etc.", icon: "Sparkles", group: "ia", section: "Agentes" },
  { href: "/app/ia/log", label: "Logs de Atendimento", description: "Histórico de interações com a IA.", icon: "ClockCounterClockwise", group: "ia", section: "Monitoramento" },

  // CONFIGURAÇÕES
  { href: "/app/configuracoes/empresa", label: "Dados da Empresa", description: "Endereço, telefone, CNPJ e dados para WhatsApp.", icon: "Buildings", group: "configuracoes", section: "Empresa" },
  { href: "/app/configuracoes/usuarios", label: "Usuários e Perfis", description: "Perfis: Produção, Financeiro, Atendimento, Admin.", icon: "UserCircle", group: "configuracoes", section: "Equipe" },
  { href: "/app/configuracoes/perfil-producao", label: "Perfil Produção", description: "Permissões da equipe de produção.", icon: "Wrench", group: "configuracoes", section: "Equipe" },
  { href: "/app/configuracoes/perfil-financeiro", label: "Perfil Financeiro", description: "Permissões da equipe financeira.", icon: "DollarCircle", group: "configuracoes", section: "Equipe" },
  { href: "/app/configuracoes/licenca", label: "Licença do Sistema", description: "Validação da chave e módulos contratados.", icon: "Key", group: "configuracoes", section: "Sistema", minRole: "admin" },
  { href: "/app/configuracoes/tema", label: "Tema e Aparência", description: "Cores, estilo de botões e personalização visual.", icon: "Palette", group: "configuracoes", section: "Sistema" },
  { href: "/app/configuracoes/whatsapp", label: "WhatsApp", description: "Configuração do WAHA e número conectado.", icon: "MessageCircle", group: "configuracoes", section: "Integrações" },
  { href: "/app/configuracoes/backup", label: "Backup Automático", description: "Configuração de backups do banco de dados.", icon: "CloudDownload", group: "configuracoes", section: "Sistema", minRole: "admin" },
];
