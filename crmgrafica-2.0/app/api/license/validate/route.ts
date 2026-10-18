/**
 * CRMGráfica 2.0 — API de Validação de Licença
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Banco mock de licenças
let licenseKeys: Array<{
  key: string;
  organizationName: string;
  plan: string;
  modules: string[];
  expiresAt: string;
  isActive: boolean;
  blocked: boolean;
  blockedReason?: string;
}> = [
  {
    key: 'DEMO-2024-CRMG',
    organizationName: 'Gráfica Demo',
    plan: 'enterprise',
    modules: ['whatsapp', 'kanban', 'agenda', 'propostas', 'financeiro', 'agentes-ia', 'multiusuario'],
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    blocked: false,
  }
];

const validateSchema = z.object({
  key: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = validateSchema.parse(body);
    
    const license = licenseKeys.find(l => l.key === validated.key);
    
    if (!license) {
      return NextResponse.json(
        { success: false, error: 'Chave de licença não encontrada' },
        { status: 404 }
      );
    }
    
    if (license.blocked) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Licença bloqueada',
          blockedReason: license.blockedReason 
        },
        { status: 403 }
      );
    }
    
    const expiresAt = new Date(license.expiresAt);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Licença expirada' },
        { status: 410 }
      );
    }
    
    return NextResponse.json({
      success: true,
      license: {
        key: license.key,
        organizationName: license.organizationName,
        plan: license.plan,
        modules: license.modules,
        expiresAt: license.expiresAt,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao validar licença' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    licenses: licenseKeys,
  });
}
