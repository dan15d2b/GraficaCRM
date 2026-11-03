import { NextRequest, NextResponse } from 'next/server';

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

const licenses: Map<string, License> = new Map();

// Pre-popular com algumas licenças de teste
const testLicense: License = {
  id: 'test-1',
  key: 'LIC-TEST1234-ABCD',
  organization_name: 'Empresa Teste',
  plan: 'professional',
  modules: ['whatsapp', 'ai', 'crm'],
  status: 'active',
  created_at: new Date().toISOString(),
  expires_at: null,
};
licenses.set(testLicense.id, testLicense);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, blocked: true, blocked_reason: 'Licença não fornecida' },
        { status: 400 }
      );
    }

    // Buscar licença pela chave
    let foundLicense: License | undefined;
    for (const license of licenses.values()) {
      if (license.key === token) {
        foundLicense = license;
        break;
      }
    }

    if (!foundLicense) {
      return NextResponse.json(
        { success: false, blocked: true, blocked_reason: 'Licença não encontrada' },
        { status: 404 }
      );
    }

    if (foundLicense.status === 'blocked') {
      return NextResponse.json(
        { success: false, blocked: true, blocked_reason: 'Licença bloqueada' },
        { status: 403 }
      );
    }

    if (foundLicense.status === 'expired') {
      return NextResponse.json(
        { success: false, blocked: true, blocked_reason: 'Licença expirada' },
        { status: 403 }
      );
    }

    // Verificar expiração
    if (foundLicense.expires_at && new Date(foundLicense.expires_at) < new Date()) {
      foundLicense.status = 'expired';
      return NextResponse.json(
        { success: false, blocked: true, blocked_reason: 'Licença expirada' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      blocked: false,
      plan: foundLicense.plan,
      modules: foundLicense.modules,
    });
  } catch (error) {
    console.error('[license/validate] Erro:', error);
    return NextResponse.json(
      { success: false, blocked: true, blocked_reason: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    info: 'Use POST para validar licença' 
  });
}