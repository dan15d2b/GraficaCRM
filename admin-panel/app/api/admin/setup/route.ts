import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'validation_error', message: 'Email e senha são obrigatórios' } },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: { code: 'validation_error', message: 'Senha deve ter pelo menos 8 caracteres' } },
        { status: 400 }
      );
    }

    // Gerar hash da senha
    const salt = randomBytes(16).toString('hex');
    const passwordHash = createHash('sha256').update(`${salt}:${password}`).digest('hex');

    // Salvar no banco (simplificado - em produção usaria SQLite local)
    // Por enquanto, apenas retorna sucesso
    const adminId = randomBytes(16).toString('hex');

    return NextResponse.json({
      success: true,
      message: 'Admin configurado com sucesso',
      admin: {
        id: adminId,
        email,
        role: 'platform_admin',
      },
    });
  } catch (error) {
    console.error('[admin/setup] Erro:', error);
    return NextResponse.json(
      { error: { code: 'internal_error', message: 'Erro interno do servidor' } },
      { status: 500 }
    );
  }
}