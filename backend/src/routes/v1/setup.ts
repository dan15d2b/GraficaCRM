/**
 * API Routes v1 - CRM Gráfica 2.0 Setup
 */

import { z } from "zod";
import { fail, ok } from "../../lib/api/wrappers";
import { isSetupComplete, markSetupComplete, initSchema, dbExecute } from "../../lib/db/local";
import { createInitialAdmin, createAccessToken, createRefreshToken } from "../../lib/auth/local";
import { validateLicense } from "../../lib/license/client";

// Schema de validação
const SetupSchema = z.object({
  licenseKey: z.string().min(1, "Chave de licença é obrigatória"),
  organizationName: z.string().min(2, "Nome da organização é obrigatório"),
  adminName: z.string().min(2, "Nome do administrador é obrigatório"),
  adminEmail: z.string().email("E-mail inválido"),
  adminPassword: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openrouterApiKey: z.string().optional(),
  googleApiKey: z.string().optional(),
}).refine(data => data.anthropicApiKey || data.openaiApiKey || data.openrouterApiKey || data.googleApiKey, {
  message: "Pelo menos uma API key de IA é obrigatória",
  path: ["_raw"],
});

export async function POST(body: any, requestId?: string) {
  try {
    // Verifica se setup já foi feito
    const done = await isSetupComplete();
    if (done) {
      return fail("already_configured", "Sistema já configurado", 400, { requestId });
    }

    const parsed = SetupSchema.safeParse(body);

    if (!parsed.success) {
      return fail(
        "validation_error",
        "Dados inválidos",
        400,
        { requestId, details: parsed.error.flatten().fieldErrors }
      );
    }

    const { licenseKey, organizationName, adminName, adminEmail, adminPassword,
            anthropicApiKey, openaiApiKey, openrouterApiKey, googleApiKey } = parsed.data;

    // 1. Valida licença na VPS
    const licenseResult = await validateLicense(licenseKey);
    if (!licenseResult.valid) {
      return fail("invalid_license", licenseResult.error ?? "Licença inválida ou expirada", 400, { requestId });
    }

    // 2. Inicializa schema do banco
    await initSchema();

    // 3. Cria admin inicial
    const { organizationId, userId } = await createInitialAdmin(
      organizationName, adminEmail, adminPassword, adminName
    );

    // 4. Salva chaves de IA (simplificado - não criptografa aqui por enquanto)
    const aiKeys = [
      { provider: "anthropic", key: anthropicApiKey },
      { provider: "openai", key: openaiApiKey },
      { provider: "openrouter", key: openrouterApiKey },
      { provider: "google", key: googleApiKey },
    ].filter((k) => k.key);

    if (aiKeys.length > 0) {
      const crypto = await import("crypto");

      for (const aiKey of aiKeys) {
        await dbExecute(
          `INSERT INTO ai_provider_credentials
           (id, organization_id, provider, encrypted_key, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [
            crypto.randomBytes(16).toString("hex"),
            organizationId,
            aiKey.provider,
            aiKey.key,
            aiKeys.indexOf(aiKey) === 0 ? 1 : 0
          ]
        );
      }
    }

    // 5. Salva licença no cache local
    const crypto2 = await import("crypto");
    await dbExecute(
      `INSERT INTO licenses
       (id, organization_id, license_key, status, plan, modules, expires_at, last_validated_at, created_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      [
        crypto2.randomBytes(16).toString("hex"),
        organizationId,
        licenseKey,
        licenseResult.plan ?? "professional",
        JSON.stringify(licenseResult.modules ?? []),
        licenseResult.expiresAt ?? null,
      ]
    );

    // 6. Marca setup como completo
    await markSetupComplete();

    // 7. Cria sessão inicial
    const accessToken = await createAccessToken({
      userId,
      organizationId,
      email: adminEmail.toLowerCase(),
      name: adminName,
      role: "dono",
    });
    const refreshToken = await createRefreshToken(userId, organizationId);

    return ok({
      success: true,
      message: "Instalação concluída com sucesso",
      tokens: { accessToken, refreshToken },
      organization: { id: organizationId, name: organizationName },
      user: { id: userId, name: adminName, email: adminEmail, role: "dono" },
    }, { requestId });

  } catch (error) {
    console.error("[setup] Erro na instalação:", error);
    return fail("internal_error", "Erro interno durante instalação", 500, { requestId });
  }
}

export async function GET(): Promise<{ setupComplete: boolean }> {
  const done = await isSetupComplete();
  return { setupComplete: done };
}