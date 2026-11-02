/**
 * Cliente de Licença — Validação contra VPS Admin
 *
 * Comunica com o Painel Admin na VPS para validar chaves de licença.
 */

import { env } from "@/lib/env";

export type LicenseKey = string;

export interface LicenseValidationResult {
  valid: boolean;
  plan?: string;
  modules?: string[];
  expiresAt?: string;
  error?: string;
}

const LICENSE_SERVER_URL = env.LICENSE_SERVER_URL || "https://license.seudominio.com";

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

    const data = await response.json();

    // VPS retorna: { success: true/false, blocked: true/false, modules: [...], plan: ..., blocked_reason: ... }
    if (!data.success) {
      return { valid: false, error: data.blocked_reason ?? data.error ?? "Licença inválida" };
    }

    if (data.blocked) {
      return { valid: false, error: data.blocked_reason ?? "Licença bloqueada" };
    }

    return {
      valid: true,
      plan: data.plan,
      modules: data.modules,
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

/**
 * Verifica status da licença periodicamente (job agendado)
 */
export async function checkLicenseStatus(licenseKey: string): Promise<LicenseValidationResult> {
  return validateLicense(licenseKey);
}

// Alias para compatibilidade com API legada
export async function checkLicense(token: string, org_id: string): Promise<{
  ok: boolean;
  error?: string;
  warning?: string;
  license?: { key: string; organizationName: string; plan: string; modules: string[]; expiresAt: Date };
}> {
  const result = await validateLicense(token);
  if (!result.valid) {
    return { ok: false, error: result.error };
  }
  return {
    ok: true,
    license: {
      key: token,
      organizationName: "Licença Válida",
      plan: result.plan ?? "professional",
      modules: result.modules ?? [],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  };
}

/**
 * Renova cache local da licença após validação bem-sucedida
 */
export async function refreshLicenseCache(
  licenseKey: string,
  organizationId: string,
): Promise<void> {
  const result = await validateLicense(licenseKey);
  if (!result.valid) {
    // Marca licença como expirada/bloqueada no cache local
    const { dbExecute } = await import("@/lib/db/local");
    await dbExecute(
      `UPDATE licenses SET status = 'expired', validation_error = ?, last_validated_at = datetime('now'), updated_at = datetime('now')
       WHERE organization_id = ? AND license_key = ?`,
      [result.error, organizationId, licenseKey],
    );
    return;
  }

  const { dbExecute } = await import("@/lib/db/local");
  await dbExecute(
    `UPDATE licenses SET status = 'active', plan = ?, modules = ?, expires_at = ?, last_validated_at = datetime('now'), validation_error = NULL, updated_at = datetime('now')
     WHERE organization_id = ? AND license_key = ?`,
    [result.plan, JSON.stringify(result.modules ?? []), result.expiresAt, organizationId, licenseKey],
  );
}