/**
 * Cliente de Licença — Validação contra VPS Admin
 *
 * Comunica com o Painel Admin na VPS para validar chaves de licença.
 */

export type LicenseKey = string;

export interface LicenseValidationResult {
  valid: boolean;
  plan?: string;
  modules?: string[];
  expiresAt?: string;
  error?: string;
}

const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || "https://license.seudominio.com";

/**
 * Valida uma chave de licença contra o servidor VPS
 */
export async function validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
  try {
    const response = await fetch(`${LICENSE_SERVER_URL}/api/license/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "CRMGrafica-Local/1.0",
      },
      body: JSON.stringify({ token: licenseKey, org_id: "local" }),
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false, error: "Licença não encontrada" };
      }
      if (response.status === 403) {
        return { valid: false, error: "Licença bloqueada ou revogada" };
      }
      return { valid: false, error: `Erro do servidor: ${response.status}` };
    }

    const data = (await response.json()) as Record<string, unknown>;

    // VPS retorna: { success: true/false, blocked: true/false, modules: [...], plan: ..., blocked_reason: ... }
    if (data.success !== true) {
      return { valid: false, error: (data.blocked_reason as string) ?? (data.error as string) ?? "Licença inválida" };
    }

    if (data.blocked === true) {
      return { valid: false, error: (data.blocked_reason as string) ?? "Licença bloqueada" };
    }

    return {
      valid: true,
      plan: data.plan as string | undefined,
      modules: data.modules as string[] | undefined,
      expiresAt: undefined, // VPS não retorna expires_at por enquanto
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { valid: false, error: "Tempo esgotado ao validar licença" };
    }
    if (error instanceof Error && error.name === "TypeError") {
      // Network error
      return { valid: false, error: "Não foi possível conectar ao servidor de licenças" };
    }
    console.error("[license] Erro ao validar:", error);
    return { valid: false, error: "Erro interno na validação" };
  }
}