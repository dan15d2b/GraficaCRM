/**
 * VetorMock — Simulador do sistema Vetor para testes locais
 *
 * Este módulo simula o comportamento do sistema Vetor, permitindo
 * testar a integração sem precisar do sistema real.
 *
 * Uso:
 *   import { VetorMock } from '@/lib/integration/vetor-mock';
 *   const mock = new VetorMock({ token: 'test-token' });
 *   await mock.syncClient({ id_vetor: 'CLI-001', nome: 'Teste' });
 */

import { randomUUID } from 'node:crypto';

export interface VetorClientData {
  id_vetor: string;
  nome: string;
  nome_fantasia?: string;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  observacoes?: string;
  tags?: string[];
}

export interface VetorQuoteItem {
  produto: string;
  quantidade: number;
  unidade?: string;
  preco_unitario: number;
  total?: number;
}

export interface VetorQuoteData {
  id_vetor: string;
  cliente_id: string;
  numero_os?: string;
  valor_total: number;
  moeda?: string;
  prazo_entrega?: string;
  condicoes_pagamento?: string;
  itens: VetorQuoteItem[];
  observacoes?: string;
}

export class VetorMock {
  private token: string;
  private clients: Map<string, VetorClientData> = new Map();
  private quotes: Map<string, VetorQuoteData> = new Map();
  private eventLog: Array<{ timestamp: Date; action: string; data: unknown }> = [];

  constructor(options?: { token?: string }) {
    this.token = options?.token ?? 'vetor-test-token';
  }

  /** Autentica uma requisição do Vetor */
  authenticate(headers: Record<string, string>): boolean {
    const authHeader = headers['x-vetor-token'] ?? headers['X-Vetor-Token'];
    return authHeader === this.token;
  }

  /** Registra um cliente/empresa */
  async syncClient(data: VetorClientData): Promise<{
    success: boolean;
    client_id: string;
    action: 'created' | 'updated';
  }> {
    const existing = this.clients.get(data.id_vetor);
    
    if (existing) {
      // Atualiza existente
      this.clients.set(data.id_vetor, { ...existing, ...data });
      this.logEvent('client.updated', data);
      return {
        success: true,
        client_id: data.id_vetor,
        action: 'updated',
      };
    }

    // Cria novo
    this.clients.set(data.id_vetor, data);
    this.logEvent('client.created', data);
    
    return {
      success: true,
      client_id: data.id_vetor,
      action: 'created',
    };
  }

  /** Recebe um orçamento */
  async receiveQuote(data: VetorQuoteData): Promise<{
    success: boolean;
    quote_id: string;
    lead_id?: string;
  }> {
    // Valida cliente
    const cliente = this.clients.get(data.cliente_id);
    if (!cliente) {
      throw new Error(`Cliente ${data.cliente_id} não encontrado`);
    }

    // Calcula totais dos itens
    const itensComTotal = data.itens.map(item => ({
      ...item,
      total: item.total ?? (item.quantidade * item.preco_unitario),
    }));
    
    const valorTotalCalculado = itensComTotal.reduce((sum, item) => sum + item.total!, 0);

    const quote: VetorQuoteData = {
      ...data,
      itens: itensComTotal,
      valor_total: valorTotalCalculado,
    };

    this.quotes.set(data.id_vetor, quote);
    this.logEvent('quote.received', quote);

    return {
      success: true,
      quote_id: data.id_vetor,
      lead_id: randomUUID(),
    };
  }

  /** Lista clientes */
  listClients(): VetorClientData[] {
    return Array.from(this.clients.values());
  }

  /** Lista orçamentos */
  listQuotes(): VetorQuoteData[] {
    return Array.from(this.quotes.values());
  }

  /** Obtém histórico de eventos */
  getEventLog(): Array<{ timestamp: Date; action: string; data: unknown }> {
    return [...this.eventLog];
  }

  /** Reseta o mock */
  reset(): void {
    this.clients.clear();
    this.quotes.clear();
    this.eventLog.length = 0;
  }

  private logEvent(action: string, data: unknown): void {
    this.eventLog.push({
      timestamp: new Date(),
      action,
      data,
    });
  }
}

/** Instância singleton para uso nos route handlers */
let _mockInstance: VetorMock | null = null;

export function getVetorMock(): VetorMock {
  if (!_mockInstance) {
    _mockInstance = new VetorMock();
  }
  return _mockInstance;
}
