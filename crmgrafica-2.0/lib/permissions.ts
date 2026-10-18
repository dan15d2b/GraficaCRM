/**
 * CRMGráfica 2.0 — Sistema de Permissões Granulares
 * 
 * Perfis padrão para operação de gráfica:
 * - Admin: acesso total
 * - Produção: movimento de pedidos, sem acesso a financeiro/conversas
 * - Financeiro: contas, sem acesso a produção/conversas
 * - Atendimento: conversas e orçamentos, sem acesso a produção/financeiro
 * - Vendas: orçamentos e pedidos, sem acesso a produção
 */

export type Role = 'admin' | 'producao' | 'financeiro' | 'atendimento' | 'vendas';

export interface PermissionSet {
  inbox: boolean;           // Conversas WhatsApp
  producao_kanban: boolean; // Quadro de produção
  producao_chegada: boolean; // Chegada de arquivo
  producao_impressao: boolean; // Em impressão
  producao_acabamento: boolean; // Em acabamento
  producao_controle_qualidade: boolean; // Controle de qualidade
  producao_pronto_retirada: boolean; // Pronto para retirada
  producao_entregues: boolean; // Entregues
  clientes: boolean;        // Cadastro de clientes
  pedidos: boolean;         // Visualização de pedidos
  cotacoes: boolean;        // Cotações/orçamentos
  catalogo: boolean;        // Catálogo de produtos
  financeiro_caixa: boolean; // Caixa
  financeiro_contas_receber: boolean; // Contas a receber
  financeiro_contas_pagar: boolean; // Contas a pagar
  financeiro_faturamento: boolean; // Faturamento
  configuracoes: boolean;   // Configurações do sistema
  licenca: boolean;         // Gestão de licença
  usuarios: boolean;        // Gerenciamento de usuários
}

/**
 * Matriz de permissões padrão por perfil
 */
export const PERMISSION_MATRIX: Record<Role, PermissionSet> = {
  admin: {
    inbox: true,
    producao_kanban: true,
    producao_chegada: true,
    producao_impressao: true,
    producao_acabamento: true,
    producao_controle_qualidade: true,
    producao_pronto_retirada: true,
    producao_entregues: true,
    clientes: true,
    pedidos: true,
    cotacoes: true,
    catalogo: true,
    financeiro_caixa: true,
    financeiro_contas_receber: true,
    financeiro_contas_pagar: true,
    financeiro_faturamento: true,
    configuracoes: true,
    licenca: true,
    usuarios: true,
  },
  
  producao: {
    inbox: false,           // NÃO vê conversas
    producao_kanban: true,
    producao_chegada: true,
    producao_impressao: true,
    producao_acabamento: true,
    producao_controle_qualidade: true,
    producao_pronto_retirada: true,
    producao_entregues: true,
    clientes: true,         // Pode ver quem é o cliente
    pedidos: true,
    cotacoes: false,        // NÃO cria orçamentos
    catalogo: true,
    financeiro_caixa: false,
    financeiro_contas_receber: false,
    financeiro_contas_pagar: false,
    financeiro_faturamento: false,
    configuracoes: false,
    licenca: false,
    usuarios: false,
  },
  
  financeiro: {
    inbox: false,
    producao_kanban: false,
    producao_chegada: false,
    producao_impressao: false,
    producao_acabamento: false,
    producao_controle_qualidade: false,
    producao_pronto_retirada: false,
    producao_entregues: false,
    clientes: true,
    pedidos: true,
    cotacoes: true,
    catalogo: false,
    financeiro_caixa: true,
    financeiro_contas_receber: true,
    financeiro_contas_pagar: true,
    financeiro_faturamento: true,
    configuracoes: false,
    licenca: false,
    usuarios: false,
  },
  
  atendimento: {
    inbox: true,
    producao_kanban: false,
    producao_chegada: false,
    producao_impressao: false,
    producao_acabamento: false,
    producao_controle_qualidade: false,
    producao_pronto_retirada: false,
    producao_entregues: false,
    clientes: true,
    pedidos: true,
    cotacoes: true,
    catalogo: true,
    financeiro_caixa: false,
    financeiro_contas_receber: false,
    financeiro_contas_pagar: false,
    financeiro_faturamento: false,
    configuracoes: false,
    licenca: false,
    usuarios: false,
  },
  
  vendas: {
    inbox: true,
    producao_kanban: false,
    producao_chegada: false,
    producao_impressao: false,
    producao_acabamento: false,
    producao_controle_qualidade: false,
    producao_pronto_retirada: false,
    producao_entregues: false,
    clientes: true,
    pedidos: true,
    cotacoes: true,
    catalogo: true,
    financeiro_caixa: false,
    financeiro_contas_receber: true, // Pode ver valores
    financeiro_contas_pagar: false,
    financeiro_faturamento: false,
    configuracoes: false,
    licenca: false,
    usuarios: false,
  },
};

/**
 * Verifica permissão de usuário
 */
export function hasPermission(role: Role, permission: keyof PermissionSet): boolean {
  return PERMISSION_MATRIX[role][permission] ?? false;
}

/**
 * Lista de módulos disponíveis para cada perfil
 */
export function getAccessibleModules(role: Role): string[] {
  const perms = PERMISSION_MATRIX[role];
  const modules: string[] = [];
  
  if (perms.inbox) modules.push('inbox');
  if (perms.producao_kanban) modules.push('producao.kanban');
  if (perms.clientes) modules.push('clientes');
  if (perms.pedidos) modules.push('pedidos');
  if (perms.cotacoes) modules.push('cotacoes');
  if (perms.financeiro_caixa) modules.push('financeiro.caixa');
  if (perms.financeiro_contas_receber) modules.push('financeiro.contas-receber');
  if (perms.configuracoes) modules.push('configuracoes');
  
  return modules;
}