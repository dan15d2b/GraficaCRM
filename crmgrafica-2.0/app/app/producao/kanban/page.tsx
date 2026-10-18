'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Printer, Scissors, CheckCircle, Clipboard, 
  AlertCircle, Clock, FileText, Truck 
} from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/workflow';
import type { ProductionOrder } from '@/lib/workflow';

const COLUMNS = [
  { id: 'prospect', label: 'Orçamentos', icon: Clipboard },
  { id: 'qualificacao', label: 'Qualificação', icon: FileText },
  { id: 'triagem', label: 'Triagem', icon: FileText },
  { id: 'impressao', label: 'Impressão', icon: Printer },
  { id: 'acabamento', label: 'Acabamento', icon: Scissors },
  { id: 'qualidade', label: 'Controle Qualidade', icon: CheckCircle },
  { id: 'pronto_retirada', label: 'Pronto', icon: CheckCircle },
  { id: 'entregue', label: 'Entregues', icon: Truck },
];

export default function ProducaoPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/producao/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMoveOrder(orderId: string, newStatus: string) {
    try {
      const res = await fetch('/api/producao/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, targetStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        if (data.order.notification) {
          alert(`Notificação gerada:\n\n${data.order.notification}`);
        }
      }
    } catch (error) {
      console.error('Erro ao mover pedido:', error);
    }
  }

  const getOrdersByStatus = (status: string) => orders.filter(o => o.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando quadro de produção...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quadro de Produção</h1>
          <p className="text-slate-500 mt-1">Acompanhe todos os serviços em andamento</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          + Novo Pedido
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 h-[calc(100vh-140px)]">
        {COLUMNS.map((column) => {
          const columnOrders = getOrdersByStatus(column.id);
          const Icon = column.icon;
          
          return (
            <div key={column.id} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-2">
                <Icon className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-sm text-slate-700">{column.label}</span>
                <span className="ml-auto bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                  {columnOrders.length}
                </span>
              </div>
              
              <div className="flex-1 bg-slate-100 rounded-lg p-2 space-y-2 overflow-y-auto">
                {columnOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => setSelectedOrder(order)}
                  />
                ))}
                
                {column.id === 'pronto_retirada' && columnOrders.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Nenhum pedido pronto
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMove={handleMoveOrder}
        />
      )}
    </div>
  );
}

function OrderCard({ order, onClick }: { order: ProductionOrder; onClick: () => void }) {
  const priorityColors = {
    low: 'bg-slate-200',
    medium: 'bg-blue-200',
    high: 'bg-amber-200',
    urgent: 'bg-red-200',
  };

  const isLate = new Date(order.dueDate) < new Date();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: 
        order.priority === 'urgent' ? '#EF4444' :
        order.priority === 'high' ? '#F59E0B' :
        order.priority === 'medium' ? '#3B82F6' : '#94A3B8'
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-slate-500">{order.orderNumber}</span>
        {isLate && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>
      
      <p className="font-medium text-sm text-slate-900 truncate">{order.clientName}</p>
      <p className="text-xs text-slate-500 mt-1 truncate">
        {order.items[0]?.productName || 'Pedido sem itens'}
      </p>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-medium text-slate-700">
          R$ {order.totalValue.toFixed(2)}
        </span>
        <div className={`w-2 h-2 rounded-full ${priorityColors[order.priority]}`} />
      </div>
    </div>
  );
}

function OrderModal({ 
  order, 
  onClose, 
  onMove 
}: { 
  order: ProductionOrder; 
  onClose: () => void; 
  onMove: (orderId: string, status: string) => void;
}) {
  const nextStatus = getNextStatus(order.status);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {order.orderNumber}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {order.clientName} — {order.clientPhone}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-2">Itens do Pedido</h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-700">{item.productName} - {item.description}</span>
                  <span className="text-slate-900 font-medium">
                    {item.quantity}x R$ {item.unitPrice.toFixed(2)} = R$ {item.totalPrice.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-slate-500">Valor total:</span>
              <span className="ml-2 font-bold text-slate-900">R$ {order.totalValue.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">Prazo:</span>
              <span className="ml-2 font-medium text-slate-900">{order.dueDate.toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Fechar</Button>
          {nextStatus && (
            <Button
              onClick={() => onMove(order.id, nextStatus)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Mover para {STATUS_CONFIG[nextStatus as keyof typeof STATUS_CONFIG]?.label || nextStatus}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function getNextStatus(current: string): string | null {
  const flow: Record<string, string> = {
    prospect: 'qualificacao',
    qualificacao: 'triagem',
    triagem: 'impressao',
    impressao: 'acabamento',
    acabamento: 'qualidade',
    qualidade: 'pronto_retirada',
    pronto_retirada: 'entregue',
  };
  return flow[current] || null;
}
