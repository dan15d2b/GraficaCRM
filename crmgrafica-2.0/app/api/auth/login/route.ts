/**
 * CRMGráfica 2.0 — API de Login
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Usuários mock (em produção: Supabase Auth)
const users = [
  {
    id: '1',
    email: 'britodaniel797@gmail.com',
    password: '123456',
    name: 'Daniel Brito',
    role: 'admin' as const,
    organizationId: 'demo-org',
    active: true,
  },
  {
    id: '2',
    email: 'admin@grafica.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin' as const,
    organizationId: 'demo-org',
    active: true,
  },
];

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);
    
    const user = users.find(u => u.email === validated.email && u.password === validated.password);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha incorretos' },
        { status: 401 }
      );
    }
    
    if (!user.active) {
      return NextResponse.json(
        { success: false, error: 'Conta desativada. Contate o suporte.' },
        { status: 403 }
      );
    }
    
    // Simula token de sessão
    const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      token,
      licenseKey: 'DEMO-2024-CRMG',
      message: 'Login realizado com sucesso!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro no servidor' },
      { status: 500 }
    );
  }
}
