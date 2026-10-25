/**
 * CRMGráfica 2.0 — Workflow de Produção (Gráfica e Comunicação Visual)
 */

export type ProductionStatus =
  | 'prospect'
  | 'qualificacao'
  | 'triagem'
  | 'impressao'
  | 'acabamento'
  | 'qualidade'
  | 'pronto_retirada'
  | 'aguardando_instalacao'
  | 'servico_concluido'
  | 'nao_fechou'
  | 'entregue';

export interface WorkflowTransition {
  from: ProductionStatus;
  to: ProductionStatus;
  allowed: boolean;
  requiresApproval: boolean;
  autoNotify?: boolean;
}

export const WORKFLOW_RULES: WorkflowTransition[] = [
  { from: 'prospect', to: 'qualificacao', allowed: true, requiresApproval: false, autoNotify: true },
  { from: 'qualificacao', to: 'triagem', allowed: true, requiresApproval: false, autoNotify: true },
  { from: 'triagem', to: 'impressao', allowed: true, requiresApproval: false, autoNotify: true },
  { from: 'impressao', to: 'acabamento', allowed: true, requiresApproval: false, autoNotify: false },
  { from: 'acabamento', to: 'qualidade', allowed: true, requiresApproval: false, autoNotify: false },
  { from: 'qualidade', to: 'pronto_retirada', allowed: true, requiresApproval: true, autoNotify: true },
  { from: 'pronto_retirada', to: 'aguardando_instalacao', allowed: true, requiresApproval: false, autoNotify: false },
  { from: 'aguardando_instalacao', to: 'servico_concluido', allowed: true, requiresApproval: false, autoNotify: false },
  { from: 'servico_concluido', to: 'entregue', allowed: true, requiresApproval: false, autoNotify: true },
  { from: 'prospect', to: 'nao_fechou', allowed: true, requiresApproval: false, autoNotify: false },
  { from: 'qualificacao', to: 'nao_fechou', allowed: true, requiresApproval: false, autoNotify: false },
  { from: 'triagem', to: 'nao_fechou', allowed: true, requiresApproval: false, autoNotify: false },
  { from: 'impressao', to: 'nao_fechou', allowed: true, requiresApproval: true, autoNotify: false },
  { from: 'acabamento', to: 'nao_fechou', allowed: true, requiresApproval: true, autoNotify: false },
  { from: 'qualidade', to: 'nao_fechou', allowed: true, requiresApproval: true, autoNotify: false },
  { from: 'pronto_retirada', to: 'nao_fechou', allowed: true, requiresApproval: true, autoNotify: false },
  { from: 'aguardando_instalacao', to: 'nao_fechou', allowed: true, requiresApproval: true, autoNotify: false },
  { from: 'servico_concluido', to: 'nao_fechou', allowed: true, requiresApproval: true, autoNotify: false },
];

export const STATUS_CONFIG: Record<ProductionStatus, { label: string; color: string; icon: string }> = {
  prospect: { label: 'Orçamento', color: 'bg-slate-100 text-slate-700', icon: 'clipboard' },
  qualificacao: { label: 'Qualificação', color: 'bg-blue-100 text-blue-700', icon: 'search' },
  triagem: { label: 'Triagem', color: 'bg-yellow-100 text-yellow-700', icon: 'file' },
  impressao: { label: 'Em Impressão', color: 'bg-blue-500 text-white', icon: 'printer' },
  acabamento: { label: 'Em Acabamento', color: 'bg-amber-500 text-white', icon: 'scissors' },
  qualidade: { label: 'Controle Qualidade', color: 'bg-purple-500 text-white', icon: 'shield' },
  pronto_retirada: { label: 'Pronto para Retirada', color: 'bg-emerald-500 text-white', icon: 'check-circle' },
  aguardando_instalacao: { label: 'Aguardando Instalação', color: 'bg-orange-400 text-white', icon: 'calendar' },
  servico_concluido: { label: 'Serviço Concluído', color: 'bg-teal-500 text-white', icon: 'check-double' },
  nao_fechou: { label: 'Não Fechou', color: 'bg-red-100 text-red-700', icon: 'x-circle' },
  entregue: { label: 'Entregue', color: 'bg-green-600 text-white', icon: 'truck' },
};

export const FUNNEL_ORDER: ProductionStatus[] = [
  'prospect', 'qualificacao', 'triagem', 'impressao', 'acabamento',
  'qualidade', 'pronto_retirada', 'aguardando_instalacao', 'servico_concluido', 'entregue',
];

export function canTransition(from: ProductionStatus, to: ProductionStatus): { allowed: boolean; requiresApproval: boolean } {
  const rule = WORKFLOW_RULES.find(r => r.from === from && r.to === to);
  return rule ? { allowed: rule.allowed, requiresApproval: rule.requiresApproval } : { allowed: false, requiresApproval: false };
}


export interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  organizationId: string;
  status: ProductionStatus;
  items?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export const AUTO_NOTIFY_STATUSES: ProductionStatus[] = [
  "pronto_retirada",
  "servico_concluido",
];
