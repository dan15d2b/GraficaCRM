import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { canTransition, generatePickupNotification } from '@/lib/workflow';
import type { ProductionOrder } from '@/lib/workflow';

let orders: ProductionOrder[] = [
  {
    id: '1',
    orderNumber: 'PED-2024-001',
    clientId: 'client-1',
    clientName: 'João Silva',
    clientPhone: '(11) 99999-1234',
    status: 'impressao' as const,
    priority: 'high' as const,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    totalValue: 450.00,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const transitionSchema = z.object({
  orderId: z.string(),
  targetStatus: z.string(),
  approvedBy: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = transitionSchema.parse(body);
    
    const order = orders.find(o => o.id === validated.orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });
    }
    
    const { allowed, requiresApproval, transition } = canTransition(
      order.status,
      validated.targetStatus as any
    );
    
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Transição não permitida' }, { status: 400 });
    }
    
    if (requiresApproval && !validated.approvedBy) {
      return NextResponse.json({ success: false, error: 'Aprovação necessária', requiresApproval: true }, { status: 403 });
    }
    
    const oldStatus = order.status;
    order.status = validated.targetStatus as any;
    order.updatedAt = new Date();
    
    const notification = transition?.autoNotify 
      ? generatePickupNotification(order, {
          name: 'Gráfica Rápida',
          address: 'Rua das Gráficas, 123',
          phone: '(11) 3333-4444',
          mapsLink: 'https://maps.google.com/?q=grafa',
          hours: 'Seg-Sex 8h-18h | Sáb 8h-12h',
        })
      : null;
    
    return NextResponse.json({
      success: true,
      order: { ...order, oldStatus, notification },
      message: notification ? 'Pedido atualizado + notificação gerada' : 'Pedido atualizado',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Erro no workflow' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, workflow: { transitions: [] } });
}
