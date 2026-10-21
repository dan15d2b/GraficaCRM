/**
 * CRMGráfica 2.0 — API de Usuários
 */
import { NextResponse } from 'next/server';
import { PERMISSION_MATRIX, type Role } from '@/lib/permissions';
import { createServerClient } from '@/lib/supabase/server';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

// Mock storage (em produção: Supabase)
let users: User[] = [
  { id: '1', name: 'Administrador', email: 'admin@grafica.com', role: 'admin', active: true },
  { id: '2', name: 'João Produção', email: 'joao@grafica.com', role: 'producao', active: true },
  { id: '3', name: 'Maria Financeiro', email: 'maria@grafica.com', role: 'financeiro', active: true },
  { id: '4', name: 'Carlos Atendimento', email: 'carlos@grafica.com', role: 'atendimento', active: true },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active })),
    roles: Object.keys(PERMISSION_MATRIX),
  });
}

export async function POST(request: Request) {
  // Verifica se há token de sessão
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 }
    );
  }

  const body = await request.json();

  // Validação básica
  if (!body.name || !body.email) {
    return NextResponse.json(
      { success: false, error: 'Nome e e-mail são obrigatórios' },
      { status: 400 }
    );
  }

  const newUser: User = {
    id: String(users.length + 1),
    name: body.name,
    email: body.email,
    role: (body.role || 'atendimento') as Role,
    active: true,
  };
  users.push(newUser);

  return NextResponse.json({
    success: true,
    user: newUser,
    permissions: PERMISSION_MATRIX[newUser.role],
  });
}
