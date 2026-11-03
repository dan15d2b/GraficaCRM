import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

interface License {
  id: string;
  key: string;
  organization_name: string;
  plan: string;
  modules: string[];
  status: 'active' | 'blocked' | 'expired';
  created_at: string;
  expires_at: string | null;
}

// Simulação de banco de dados em memória
const licenses: Map<string, License> = new Map();

export async function GET() {
  const allLicenses = Array.from(licenses.values());
  return NextResponse.json({ licenses: allLicenses });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_name, plan = 'professional', modules = [], expires_at = null } = body;

    if (!organization_name) {
      return NextResponse.json(
        { error: { code: 'validation_error', message: 'Nome da organização é obrigatório' } },
        { status: 400 }
      );
    }

    // Gerar chave de licença
    const key = `LIC-${randomBytes(8).toString('hex').toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
    const id = randomBytes(16).toString('hex');

    const license: License = {
      id,
      key,
      organization_name,
      plan,
      modules,
      status: 'active',
      created_at: new Date().toISOString(),
      expires_at,
    };

    licenses.set(id, license);

    return NextResponse.json({ license }, { status: 201 });
  } catch (error) {
    console.error('[admin/licenses] Erro:', error);
    return NextResponse.json(
      { error: { code: 'internal_error', message: 'Erro interno do servidor' } },
      { status: 500 }
    );
  }
}