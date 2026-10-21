/**
 * CRMGráfica 2.0 — API de Validação de Licença
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkLicense } from "@/lib/license/client";

const validateSchema = z.object({
  key: z.string().min(1),
  orgId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = validateSchema.parse(body);

    const result = await checkLicense(validated.key, validated.orgId);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, warning: result.warning },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      license: {
        key: result.license!.key,
        organizationName: result.license!.organizationName,
        plan: result.license!.plan,
        modules: result.license!.modules,
        expiresAt: result.license!.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Erro ao validar licença" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, info: "Use POST para validar" });
}
