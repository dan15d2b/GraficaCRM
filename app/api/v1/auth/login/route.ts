import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, createAccessToken, createRefreshToken } from "@/lib/auth/local";

const LoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "validation_error", message: "Dados inválidos", details: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const session = await authenticateUser(email, password);

    if (!session) {
      return NextResponse.json(
        { error: { code: "invalid_credentials", message: "E-mail ou senha incorretos" } },
        { status: 401 },
      );
    }

    const accessToken = await createAccessToken(session);
    const refreshToken = await createRefreshToken(session.userId, session.organizationId);

    return NextResponse.json({
      success: true,
      tokens: { accessToken, refreshToken },
      user: {
        id: session.userId,
        organizationId: session.organizationId,
        email: session.email,
        name: session.name,
        role: session.role,
      },
    });
  } catch (error) {
    console.error("[auth/login] Erro:", error);
    return NextResponse.json(
      { error: { code: "internal_error", message: "Erro interno no login" } },
      { status: 500 },
    );
  }
}