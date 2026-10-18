/**
 * CRMGráfica 2.0 — Módulo de Licenciamento
 */

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

export type LicensePlan = 'starter' | 'professional' | 'enterprise';
export type LicensedModule = 
  | 'whatsapp'
  | 'kanban'
  | 'agenda'
  | 'propostas'
  | 'financeiro'
  | 'relatorios'
  | 'agentes-ia'
  | 'multiusuario'
  | 'backup-automatico';

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

export class DevelopmentLicenseServer implements ILicenseServer {
  async validate(key: string, orgId: string): Promise<LicenseValidationResult> {
    return {
      success: true,
      license: {
        id: crypto.randomUUID(),
        key,
        organizationId: orgId,
        organizationName: "Gráfica Teste Ltda",
        plan: "professional",
        modules: ['whatsapp', 'kanban', 'agenda', 'propostas', 'agentes-ia'],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isValid: true,
        blocked: false,
        lastValidation: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    };
  }
  async revoke(key: string, reason: string): Promise<void> {
    console.log(`[License] Chave ${key} revogada: ${reason}`);
  }
  async updateModules(key: string, modules: LicensedModule[]): Promise<void> {
    console.log(`[License] Módulos atualizados para ${key}:`, modules);
  }
}

export class ProductionLicenseServer implements ILicenseServer {
  private serverUrl: string;
  constructor() {
    this.serverUrl = process.env.LICENSE_SERVER_URL || '';
  }
  
  async validate(key: string, orgId: string): Promise<LicenseValidationResult> {
    if (!this.serverUrl) {
      return { success: false, error: 'Servidor de licenças não configurado' };
    }
    try {
      const res = await fetch(`${this.serverUrl}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, orgId }),
      });
      if (!res.ok) return { success: false, error: 'Falha na validação' };
      return await res.json();
    } catch {
      return { success: false, error: 'Servidor indisponível' };
    }
  }
  async revoke(key: string, reason: string): Promise<void> {
    // Implementation
  }
  async updateModules(key: string, modules: LicensedModule[]): Promise<void> {
    // Implementation
  }
}

export class LicenseClient {
  private server: ILicenseServer;
  private cache = new Map<string, { result: LicenseValidationResult; expiresAt: number }>();

  constructor(server: ILicenseServer) {
    this.server = server;
  }

  async validate(key: string, orgId: string): Promise<LicenseValidationResult> {
    const cacheKey = `${key}-${orgId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    const result = await this.server.validate(key, orgId);
    this.cache.set(cacheKey, { result, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    return result;
  }

  isModuleLicensed(license: LicenseKey, module: LicensedModule): boolean {
    return license.modules.includes(module);
  }
}

let licenseClient: LicenseClient | null = null;
export function getLicenseClient(): LicenseClient {
  if (!licenseClient) {
    const isProd = process.env.NODE_ENV === 'production';
    licenseClient = new LicenseClient(
      isProd ? new ProductionLicenseServer() : new DevelopmentLicenseServer()
    );
  }
  return licenseClient;
}
