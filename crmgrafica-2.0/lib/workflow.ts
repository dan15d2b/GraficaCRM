/**
 * CRMGráfica 2.0 — Workflow e Gatilhos de Produção
 * 
 * Gerencia transições de status e notificações automáticas.
 */

export type ProductionStatus = 
  | 'prospect'           // Orçamento pendente
  | 'qualificacao'       // Qualificação técnica
  | 'triagem'            // Triagem de arquivos
  | 'impressao'          // Em impressão
  | 'acabamento'         // Em acabamento
  | 'qualidade'          // Controle de qualidade
  | 'pronto_retirada'    // Pronto para retirada
  | 'entregue';          // Entregue

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  status: ProductionStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  totalValue: number;
  items: OrderItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface WorkflowTransition {
  from: ProductionStatus;
  to: ProductionStatus;
  allowed: boolean;
  requiresApproval: boolean;
  autoNotify?: boolean;
}

export interface NotificationConfig {
  whatsapp: boolean;
  email: boolean;
  system: boolean;
}

/**
 * Regras de transição do funil de produção
 */
export const WORKFLOW_RULES: WorkflowTransition[] = [
  { from: 'prospect', to: 'qualificacao', allowed: true, requiresApproval: false, autoNotify: true },
  { from: 'qualificacao', to: 'triagem', allowed: true, requiresApproval: false, autoNotify: true },
  { from: 'triagem', to: 'impressao', allowed: true, requiresApproval: false, autoNotify: true },
  { from: 'impressao', to: 'acabamento', allowed: true, requiresApproval: false, autoNotify: false },
  { from: 'acabamento', to: 'qualidade', allowed: true, requiresApproval: false, autoNotify: false },
  { from: 'qualidade', to: 'pronto_retirada', allowed: true, requiresApproval: true, autoNotify: true },
  { from: 'pronto_retirada', to: 'entregue', allowed: true, requiresApproval: false, autoNotify: true },
];

/**
 * Tabela de status para exibição
 */
export const STATUS_CONFIG = {
  prospect: { label: 'Orçamento', color: 'bg-slate-100 text-slate-700', icon: 'clipboard' },
  qualificacao: { label: 'Qualificação', color: 'bg-blue-100 text-blue-700', icon: 'search' },
  triagem: { label: 'Triagem', color: 'bg-yellow-100 text-yellow-700', icon: 'file' },
  impressao: { label: 'Em Impressão', color: 'bg-blue-500 text-white', icon: 'printer' },
  acabamento: { label: 'Em Acabamento', color: 'bg-amber-500 text-white', icon: 'scissors' },
  qualidade: { label: 'Controle Qualidade', color: 'bg-purple-500 text-white', icon: 'shield' },
  pronto_retirada: { label: 'Pronto para Retirada', color: 'bg-green-500 text-white', icon: 'check' },
  entregue: { label: 'Entregue', color: 'bg-emerald-600 text-white', icon: 'truck' },
};

/**
 * Verifica se uma transição é permitida
 */
export function canTransition(
  currentStatus: ProductionStatus, 
  targetStatus: ProductionStatus,
  workflowRules: WorkflowTransition[] = WORKFLOW_RULES
): { allowed: boolean; requiresApproval: boolean; transition?: WorkflowTransition } {
  const rule = workflowRules.find(
    r => r.from === currentStatus && r.to === targetStatus
  );
  
  if (!rule) {
    return { allowed: false, requiresApproval: false };
  }
  
  return {
    allowed: rule.allowed,
    requiresApproval: rule.requiresApproval,
    transition: rule,
  };
}

/**
 * Gera mensagem de notificação para "Pronto para Retirada"
 */
export function generatePickupNotification(
  order: ProductionOrder,
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    mapsLink: string;
    hours: string;
  }
): string {
  return `Olá ${order.clientName}! 🎉

Seu pedido #${order.orderNumber} está **pronto para retirada** na ${companyInfo.name}.

📍 Endereço: ${companyInfo.address}
🗺️ Localização: ${companyInfo.mapsLink}
📞 Telefone: ${companyInfo.phone}
🕐 Horário: ${companyInfo.hours}

Aguardo você para retirar seu material!`;
}

/**
 * CalculaSLA de entrega
 */
export function calculateSLA(
  order: ProductionOrder,
  SLATimeInHours: number
): { slaDeadline: Date; isLate: boolean; hoursRemaining: number } {
  const slaDeadline = new Date(order.createdAt);
  slaDeadline.setHours(slaDeadline.getHours() + SLATimeInHours);
  
  const now = new Date();
  const hoursRemaining = (slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return {
    slaDeadline,
    isLate: now > slaDeadline,
    hoursRemaining: Math.max(0, hoursRemaining),
  };
}

/**
 * Prioridade baseada em prazos
 */
export function recalculatePriority(
  order: ProductionOrder,
  SLATimeInHours: number
): ProductionOrder['priority'] {
  const { isLate, hoursRemaining } = calculateSLA(order, SLATimeInHours);
  
  if (isLate) return 'urgent';
  if (hoursRemaining < 4) return 'high';
  if (hoursRemaining < 24) return 'medium';
  return 'low';
}
