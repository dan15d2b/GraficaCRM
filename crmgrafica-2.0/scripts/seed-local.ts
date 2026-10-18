/**
 * CRMGráfica 2.0 — Seed de Dados Local (Mock)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Seed iniciando...');
  
  // Criar organização demo
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: 'Gráfica Demo Ltda',
      cnpj: '12345678000199',
      address: 'Rua das Gráficas, 123',
      phone: '(11) 3333-4444',
      email: 'contato@graficademo.com.br',
      theme_config: { primary: '#2563EB', isDark: false },
      settings: {},
    })
    .select()
    .single();
  
  if (orgError) {
    console.error('Erro ao criar organização:', orgError.message);
    return;
  }
  
  console.log('✅ Organização criada:', org.id);
  
  // Criar usuários
  await Promise.all([
    supabase.from('users').insert({
      organization_id: org.id,
      email: 'admin@grafica.com',
      password_hash: '$2b$10$demo',
      name: 'Administrador',
      role: 'admin',
      active: true,
    }),
    supabase.from('users').insert({
      organization_id: org.id,
      email: 'joao@grafica.com',
      password_hash: '$2b$10$demo',
      name: 'João Produção',
      role: 'producao',
      active: true,
    }),
    supabase.from('users').insert({
      organization_id: org.id,
      email: 'maria@grafica.com',
      password_hash: '$2b$10$demo',
      name: 'Maria Financeiro',
      role: 'financeiro',
      active: true,
    }),
  ]);
  
  console.log('✅ Usuários criados');
  
  // Criar cliente
  const { data: client } = await supabase.from('clients').insert({
    organization_id: org.id,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-1234',
    document: '123.456.789-00',
  }).select().single();
  
  // Criar pedidos
  if (client) {
    await Promise.all([
      supabase.from('orders').insert({
        organization_id: org.id,
        client_id: client.id,
        order_number: 'PED-2024-001',
        status: 'impressao',
        priority: 1,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        total_value: 450.00,
      }),
      supabase.from('orders').insert({
        organization_id: org.id,
        client_id: client.id,
        order_number: 'PED-2024-002',
        status: 'pronto_retirada',
        priority: 1,
        due_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        total_value: 890.00,
      }),
    ]);
    
    console.log('✅ Pedidos criados');
  }
  
  console.log('🎉 Seed concluído!');
}

seed().catch(console.error);
