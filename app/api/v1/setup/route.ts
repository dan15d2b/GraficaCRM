import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSupportWrite } from "@/lib/impersonate/support";
import { isSetupComplete, markSetupComplete, initSchema } from "@/lib/db/local";
import { createInitialAdmin } from "@/lib/auth/local";
import { validateLicense } from "@/lib/license/client";

const SetupSchema = z.object({
  // Licença (validada na VPS)
  licenseKey: z.string().min(1, "Chave de licença é obrigatória"),

  // Admin local
  organizationName: z.string().min(2, "Nome da organização é obrigatório"),
  adminName: z.string().min(2, "Nome do administrador é obrigatório"),
  adminEmail: z.string().email("E-mail inválido"),
  adminPassword: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),

  // Chaves de IA (pelo menos uma)
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openrouterApiKey: z.string().optional(),
  googleApiKey: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Setup é um handler especial - não requer requireSupportWrite pois é o primeiro passo
  // da instalação, antes do sistema estar configurado. O support_readonly só vale
  // após setup completo.
  try {
    // Verifica se setup já foi feito
    const done = await isSetupComplete();
    if (done) {
      return NextResponse.json(
        { error: { code: "already_configured", message: "Sistema já configurado" } },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = SetupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "validation_error", message: "Dados inválidos", details: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const { licenseKey, organizationName, adminName, adminEmail, adminPassword, anthropicApiKey, openaiApiKey, openrouterApiKey, googleApiKey } = parsed.data;

    // 1. Valida licença na VPS
    const licenseResult = await validateLicense(licenseKey);
    if (!licenseResult.valid) {
      return NextResponse.json(
        { error: { code: "invalid_license", message: licenseResult.error ?? "Licença inválida ou expirada" } },
        { status: 400 },
      );
    }

    // 2. Inicializa schema do banco
    await initSchema();

    // 3. Cria admin inicial
    const { organizationId, userId } = await createInitialAdmin(organizationName, adminEmail, adminPassword, adminName);

    // 4. Salva chaves de IA no banco (criptografadas)
    if (anthropicApiKey || openaiApiKey || openrouterApiKey || googleApiKey) {
      const { dbExecute } = await import("@/lib/db/local");
      const crypto = await import("crypto");

      // Usa AI_CRED_AES_KEY do env para criptografar
      const masterKey = process.env.AI_CRED_AES_KEY;
      if (!masterKey || masterKey.length < 32) {
        console.warn("[setup] AI_CRED_AES_KEY não configurada — chaves IA não serão criptografadas");
      }

      const aiKeys = [
        { provider: "anthropic", key: anthropicApiKey },
        { provider: "openai", key: openaiApiKey },
        { provider: "openrouter", key: openrouterApiKey },
        { provider: "google", key: googleApiKey },
      ].filter((k) => k.key);

      for (const aiKey of aiKeys) {
        let encryptedKey = aiKey.key!;
        if (masterKey && masterKey.length >= 32) {
          // Criptografa com AES-256-GCM
          const iv = crypto.randomBytes(12);
          const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(masterKey.slice(0, 32), "base64"), iv);
          const encrypted = Buffer.concat([cipher.update(aiKey.key!, "utf8"), cipher.final()]);
          const authTag = cipher.getAuthTag();
          encryptedKey = Buffer.concat([iv, encrypted, authTag]).toString("base64");
        }

        await dbExecute(
          `INSERT INTO ai_provider_credentials (id, organization_id, provider, encrypted_key, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [crypto.randomBytes(16).toString("hex"), organizationId, aiKey.provider, encryptedKey, aiKeys.indexOf(aiKey) === 0 ? 1 : 0],
        );
      }
    }

    // 5. Salva licença no cache local
    const { dbExecute } = await import("@/lib/db/local");
    const crypto = await import("crypto");
    await dbExecute(
      `INSERT INTO licenses (id, organization_id, license_key, status, plan, modules, expires_at, last_validated_at, created_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      [
        crypto.randomBytes(16).toString("hex"),
        organizationId,
        licenseKey,
        licenseResult.plan ?? "professional",
        JSON.stringify(licenseResult.modules ?? []),
        licenseResult.expiresAt ?? null,
      ],
    );

    // 6. Marca setup como completo
    await markSetupComplete();

    // 7. Cria sessão inicial (retorna tokens para o frontend definir cookies)
    const { createAccessToken, createRefreshToken } = await import("@/lib/auth/local");
    const accessToken = await createAccessToken({
      userId,
      organizationId,
      email: adminEmail.toLowerCase(),
      name: adminName,
      role: "dono",
    });
    const refreshToken = await createRefreshToken(userId, organizationId);

    return NextResponse.json({
      success: true,
      message: "Instalação concluída com sucesso",
      tokens: { accessToken, refreshToken },
      organization: { id: organizationId, name: organizationName },
      user: { id: userId, name: adminName, email: adminEmail, role: "dono" },
    });
  } catch (error) {
    console.error("[setup] Erro na instalação:", error);
    return NextResponse.json(
      { error: { code: "internal_error", message: "Erro interno durante instalação" } },
      { status: 500 },
    );
  }
}