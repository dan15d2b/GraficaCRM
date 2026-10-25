/**
 * CRMGráfica 2.0 — Guard de Licença para Autenticação
 *
 * Integra validação de licença ao fluxo de auth do DeskcommCRM.
 * Só é aplicado quando CRMGRAFICA_SKIP_ONBOARDING=1.
 */

import { checkLicense, type LicenseKey } from '@/lib/license/client';
import { logger } from '@/lib/logger';

export interface LicenseGuardResult {
  ok: boolean;
  license?: LicenseKey;
  error?: string;
  warning?: string;
}

/**
 * Verifica licença do usuário logado.
 * Chave da licença deve estar no user_metadata do Supabase Auth.
 */
export async function guardLicenseForUser(
  userId: string,
  orgId: string
): Promise<LicenseGuardResult> {
  // Em dev, pula validação
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true };
  }

  // Em instalações locais sem LICENSE_SERVER_URL, pula validação
  if (!process.env.LICENSE_SERVER_URL) {
    logger.info('Modo local detectado — pulando validação online');
    return { ok: true };
  }

  // Busca chave da licença do usuário (armazenada no metadata durante signup)
  const supabase = await import('@/lib/supabase/server').then(m => m.createClient());
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { ok: false, error: 'Usuário não autenticado' };
  }

  const licenseKey = user.user_metadata?.license_key as string | undefined;
  if (!licenseKey) {
    return {
      ok: false,
      error: 'Chave de licença não encontrada. Contate o suporte.',
    };
  }

  const result = await checkLicense(licenseKey, orgId);
  return result;
}

/**
 * Middleware de borda que verifica licença em cada requisição.
 * Deve ser chamado em proxy.ts ou middleware.ts.
 */
export async function checkLicenseMiddleware(
  orgId: string
): Promise<{ ok: boolean; error?: string; warning?: string }> {
  if (process.env.NODE_ENV !== 'production') return { ok: true };
  if (!process.env.LICENSE_SERVER_URL) return { ok: true };

  const supabase = await import('@/lib/supabase/server').then(m => m.createClient());
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { ok: true }; // Não logado — será redirecionado pelo auth

  const licenseKey = user.user_metadata?.license_key as string | undefined;
  if (!licenseKey) {
    return { ok: false, error: 'Chave de licença não configurada' };
  }

  return checkLicense(licenseKey, orgId);
}
