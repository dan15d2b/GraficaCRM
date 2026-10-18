import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrders, createOrder } from '@/lib/db/orders';
import { createAdminClient } from '@/lib/supabase/admin';

const createOrderSchema = z.object({
  clientId: z.string().min(1),
  clientName: z.string().min(2),
  clientPhone: z.string().min(8),
  items: z.array(z.object({
    productName: z.string(),
    description: z.string().optional(),
    quantity: z.number(),
    unit: z.string(),
    unitPrice: z.number(),
  })),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: orgs } = await supabase
      .from('organizations' as any)
      .select('id')
      .limit(1);
    
    if (!orgs?.length) {
      return NextResponse.json({ success: true, count: 0, orders: [] });
    }
    
    const organizationId = (orgs[0] as any).id;
    const orders = await getOrders(organizationId);
    
    return NextResponse.json({ success: true, count: orders?.length || 0, orders });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createOrderSchema.parse(body);
    
    const supabase = createAdminClient();
    const { data: orgs } = await supabase
      .from('organizations' as any)
      .select('id')
      .limit(1);
    
    if (!orgs?.length) {
      return NextResponse.json({ success: false, error: 'Organização não encontrada' }, { status: 404 });
    }
    
    const organizationId = (orgs[0] as any).id;
    
    const { data: existingClient } = await supabase
      .from('clients' as any)
      .select('id')
      .eq('name', validated.clientName)
      .single();
    
    let clientId = (existingClient as any)?.id;
    
    if (!clientId) {
      const result = await supabase
        .from('clients' as any)
        .insert({ organization_id: organizationId, name: validated.clientName, phone: validated.clientPhone } as any)
        .select();
      clientId = (result.data as any)?.[0]?.id;
    }
    
    const order = await createOrder(organizationId, {
      clientId,
      items: validated.items,
      dueDate: validated.dueDate,
      notes: validated.notes,
    });
    
    return NextResponse.json({ success: true, order, message: 'Pedido criado' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
    }
    console.error('Erro:', error);
    return NextResponse.json({ success: false, error: 'Erro ao criar pedido' }, { status: 500 });
  }
}
