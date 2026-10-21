/**
 * CRMGráfica 2.0 — API de Geração de Licença (Admin)
 */
import { NextResponse } from "next/server";
import { z } from "zod";

const generateSchema = z.object({
  organizationName: z.string().min(2),
  plan: z.enum(["starter", "professional", "enterprise"]),
  months: z.number().min(1).max(12),
});

function generateLicenseKey(plan: string): string {
  const prefix = plan.toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const date = new Date().getFullYear().toString().slice(-2);
  return `${prefix}-${date}-${random}`;
}

function getModulesForPlan(plan: string): string[] {
  switch (plan) {
    case "starter":
      return ["whatsapp", "kanban"];
    case "professional":
      return ["whatsapp", "kanban", "agenda", "propostas", "financeiro"];
    case "enterprise":
      return [
        "whatsapp",
        "kanban",
        "agenda",
        "propostas",
        "financeiro",
        "relatorios",
        "agentes-ia",
        "multiusuario",
      ];
    default:
      return ["whatsapp"];
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = generateSchema.parse(body);

    const key = generateLicenseKey(validated.plan);
    const newLicense = {
      key,
      organizationName: validated.organizationName,
      plan: validated.plan,
      modules: getModulesForPlan(validated.plan),
      expiresAt: new Date(Date.now() + validated.months * 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    return NextResponse.json({
      success: true,
      license: newLicense,
      message: "Licença gerada com sucesso!",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Erro ao gerar licença" }, { status: 500 });
  }
}
