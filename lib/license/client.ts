/**
 * CRMGráfica 2.0 — Módulo de Licenciamento Integrado
 *
 * Valida chaves de licença contra servidor externo (ou mock em dev).
 * Integra-se ao fluxo de auth via lib/auth/license-guard.ts.
 */

import { env } from "@/lib/env";

export type LicensePlan = "starter" | "professional" | "enterprise";
export type LicensedModule =
  | "whatsapp"
  | "kanban"
  | "agenda"
  | "propostas"
  | "financeiro"
  | "relatorios"
  | "agentes-ia"
  | "multiusuario"
  | "backup-automatico";

export interface LicenseKey {
  id: string;
  key: string;
  organizationId: string;
  organizationName: string;
  plan: LicensePlan;
  modules: LicensedModule[];
  expiresAt: Date;
  isValid: boolean;
  blocked: boolean;
  blockedReason?: string;
  lastValidation: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LicenseValidationResult {
  success: boolean;
  license?: LicenseKey;
  error?: string;
  warning?: string;
}

export interface ILicenseServer {
  validate(key: string, orgId: string): Promise<LicenseValidationResult>;
  revoke(key: string, reason: string): Promise<void>;
  updateModules(key: string, modules: LicensedModule[]): Promise<void>;
}

/**
 * Servidor de licenças para desenvolvimento local (mock)
 */
export class DevelopmentLicenseServer implements ILicenseServer {
  private mockLicense: LicenseKey;

  constructor() {
    this.mockLicense = {
      id: crypto.randomUUID(),
      key: "DEMO-2026-CRMG",
      organizationId: "demo-org",
      organizationName: "Gráfica Demo Ltda",
      plan: "enterprise",
      modules: [
        "whatsapp",
        "kanban",
        "agenda",
        "propostas",
        "financeiro",
        "relatorios",
        "agentes-ia",
        "multiusuario",
      ],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isValid: true,
      blocked: false,
      lastValidation: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async validate(key: string, orgId: string): Promise<LicenseValidationResult> {
    if (key === "BLOQUEADA-TESTE") {
      return {
        success: false,
        error: "Licença bloqueada por inadimplência",
        warning: "Entre em contato com o suporte para regularizar.",
      };
    }
    return { success: true, license: this.mockLicense };
  }

  async revoke(key: string, reason: string): Promise<void> {
    console.log(`[License] Chave ${key} revogada: ${reason}`);
  }

  async updateModules(key: string, modules: LicensedModule[]): Promise<void> {
    console.log(`[License] Módulos atualizados para ${key}:`, modules);
  }
}

/**
 * Servidor de licenças para produção (chama API externa)
 */
export class ProductionLicenseServer implements ILicenseServer {
  private serverUrl: string;
  private validationIntervalMs: number;

  constructor() {
    this.serverUrl = env.LICENSE_SERVER_URL || "";
    const intervalHours = parseInt(env.LICENSE_VALIDATION_INTERVAL_HOURS || "24", 10);
    this.validationIntervalMs = Math.min(intervalHours, 72) * 60 * 60 * 1000;
  }

  async validate(key: string, orgId: string): Promise<LicenseValidationResult> {
    if (!this.serverUrl) {
      return { success: false, error: "Servidor de licenças não configurado" };
    }
    try {
      const res = await fetch(`${this.serverUrl}/api/license/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, orgId }),
      });
      if (!res.ok) return { success: false, error: `Falha na validação (HTTP ${res.status})` };
      return await res.json();
    } catch {
      return {
        success: false,
        error: "Servidor de licenças indisponível",
        warning: "Em modo de tolerância: sistema opera com limitações.",
      };
    }
  }

  async revoke(key: string, reason: string): Promise<void> {
    if (!this.serverUrl) return;
    try {
      await fetch(`${this.serverUrl}/api/license/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, reason }),
      });
    } catch {
      console.error("[License] Falha ao revogar chave:", key);
    }
  }

  async updateModules(key: string, modules: LicensedModule[]): Promise<void> {
    if (!this.serverUrl) return;
    try {
      await fetch(`${this.serverUrl}/api/license/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, modules }),
      });
    } catch {
      console.error("[License] Falha ao atualizar módulos:", key);
    }
  }
}

/**
 * Cliente de licença com cache em memória (TTL = intervalo de validação)
 */
export class LicenseClient {
  private server: ILicenseServer;
  private cache = new Map<string, { result: LicenseValidationResult; expiresAt: number }>();
  private lastResult: LicenseValidationResult | null = null;

  constructor(server: ILicenseServer) {
    this.server = server;
  }

  async validate(key: string, orgId: string): Promise<LicenseValidationResult> {
    const cacheKey = `${key}-${orgId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
    const result = await this.server.validate(key, orgId);
    const ttl = Math.max(1, Math.floor(this.server instanceof ProductionLicenseServer ? 12 : 24) * 60 * 60 * 1000);
    this.cache.set(cacheKey, { result, expiresAt: Date.now() + ttl });
    this.lastResult = result;
    return result;
  }

  isModuleLicensed(license: LicenseKey, module: LicensedModule): boolean {
    return license.modules.includes(module);
  }

  getWarning(): string | undefined { return this.lastResult?.warning; }
  getError(): string | undefined { return this.lastResult?.error; }
}

let licenseClient: LicenseClient | null = null;

export function getLicenseClient(): LicenseClient {
  if (!licenseClient) {
    const isProd = process.env.NODE_ENV === "production";
    licenseClient = new LicenseClient(
      isProd ? new ProductionLicenseServer() : new DevelopmentLicenseServer()
    );
  }
  return licenseClient;
}

/**
 * Verifica licença e retorna resultado para uso no auth/guard
 */
export async function checkLicense(key: string, orgId: string): Promise<{
  ok: boolean;
  license?: LicenseKey;
  error?: string;
  warning?: string;
}> {
  const client = getLicenseClient();
  const result = await client.validate(key, orgId);

  if (!result.success) {
    return { ok: false, error: result.error, warning: result.warning };
  }
  if (!result.license?.isValid) return { ok: false, error: "Licença inválida" };
  if (result.license.blocked) {
    return { ok: false, error: "Licença bloqueada", warning: result.license.blockedReason };
  }
  if (result.license.expiresAt < new Date()) return { ok: false, error: "Licença expirada" };
  return { ok: true, license: result.license };
}
