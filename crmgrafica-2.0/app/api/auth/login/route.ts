/**
 * CRMGráfica 2.0 — Rota de Login
 * POST /api/auth/login
 * 
 * Autenticação com email/senha + validação de licença.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // TODO: Implementar autenticação real com Supabase Auth
    // Por enquanto, simulação para desenvolvimento
    
    const mockUser = {
      id: 'demo-user-1',
      email: validated.email,
      name: 'Usuário Demo',
      role: 'admin' as const,
      organizationId: 'demo-org',
    };

    // Simula verificação de licença
    const licenseValid = process.env.LICENSE_SERVER_URL 
      ? await validateLicense(mockUser.organizationId)
      : true;

    if (!licenseValid) {
      return NextResponse.json(
        { error: 'Licença inválida ou expirada' },
        { status: 403 }
      );
    }

    // Resposta bem-sucedida
    return NextResponse.json({
      success: true,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      },
      message: 'Login realizado com sucesso',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}

/**
 * Valida licença contra o servidor (simulado)
 */
async function validateLicense(orgId: string): Promise<boolean> {
  // Em produção, chamar LICENSE_SERVER_URL
  // Por enquanto, retorna true para demo
  console.log(`[License] Validando licença para org: ${orgId}`);
  return true;
}
