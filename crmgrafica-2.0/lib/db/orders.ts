import { createAdminClient } from '../supabase/admin';

export async function getOrders(organizationId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, clients(name, phone), order_items(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createOrder(organizationId: string, orderData: any) {
  const supabase = createAdminClient() as any;
  
  const orderNumber = `PED-${new Date().getFullYear()}-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
  const totalValue = (orderData.items || []).reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
  
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      organization_id: organizationId,
      order_number: orderNumber,
      status: 'prospect',
      priority: 0,
      total_value: totalValue,
      due_date: orderData.dueDate,
      notes: orderData.notes,
      created_by: orderData.createdBy,
    })
    .select()
    .single();
  
  if (orderError) throw orderError;
  
  if ((orderData.items || []).length) {
    const items = (orderData.items as any[]).map((item: any) => ({
      order_id: (order as any).id,
      product_name: item.productName,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
    }));
    
    const { error: itemsError } = await supabase.from('order_items').insert(items);
    if (itemsError) throw itemsError;
  }
  
  return order;
}

export async function updateOrderStatus(orderId: string, newStatus: string, organizationId: string) {
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('organization_id', organizationId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getOrderById(orderId: string, organizationId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, clients(*), order_items(*)')
    .eq('id', orderId)
    .eq('organization_id', organizationId)
    .single();
  
  if (error) throw error;
  return data;
}
