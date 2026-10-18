/**
 * CRMGráfica 2.0 — Tipos do Banco
 */
export type ProductionStatus = 
  | 'prospect'
  | 'qualificacao'
  | 'triagem'
  | 'impressao'
  | 'acabamento'
  | 'qualidade'
  | 'pronto_retirada'
  | 'entregue';

export interface OrderItemData {
  productName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface ProductionOrder {
  id: string;
  organizationId: string;
  clientId?: string;
  orderNumber: string;
  status: ProductionStatus;
  priority: number;
  dueDate?: string;
  totalValue: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  clients?: { name: string; phone: string };
  order_items?: OrderItem[];
  items?: OrderItemData[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface LicenseKey {
  id: string;
  key: string;
  organizationId?: string;
  plan: string;
  modules: string[];
  expiresAt: string;
  blocked: boolean;
  blockedReason?: string;
  lastValidation?: string;
  createdAt: string;
  updatedAt: string;
}
