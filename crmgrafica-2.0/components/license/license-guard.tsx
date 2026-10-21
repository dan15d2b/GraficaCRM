/**
 * CRMGráfica 2.0 — Guardião de Licenciamento
 *
 * Verifica a validade da licença antes de permitir acesso ao sistema.
 * A chave de licença é armazenada em localStorage pelo usuário no login.
 */
'use client';

import { useEffect, useState } from 'react';
import { getLicenseClient } from '@/lib/license';
import { useRouter } from 'next/navigation';

const LICENSE_STORAGE_KEY = 'crmgrafica_license_key';
const ORG_STORAGE_KEY = 'crmgrafica_org_id';

export function LicenseGuard({ children }: { children: React.ReactNode }) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [warning, setWarning] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    async function checkLicense() {
      try {
        const licenseClient = getLicenseClient();
        // Busca a licença salva pelo usuário no login
        const storedKey = localStorage.getItem(LICENSE_STORAGE_KEY);
        const storedOrg = localStorage.getItem(ORG_STORAGE_KEY);

        if (!storedKey || !storedOrg) {
          setWarning('Licença não encontrada. Faça login para continuar.');
          setIsValid(false);
          return;
        }

        const result = await licenseClient.validate(storedKey, storedOrg);

        if (result.success && result.license) {
          if (result.license.blocked) {
            setWarning(result.license.blockedReason || 'Licença bloqueada');
            setIsValid(false);
          } else {
            // Tenta comparar como Date; se for string ISO, converte
            const expiresAt = result.license.expiresAt instanceof Date
              ? result.license.expiresAt
              : new Date(result.license.expiresAt);
            if (expiresAt < new Date()) {
              setWarning('Licença expirada. Entre em contato com o suporte.');
              setIsValid(false);
            } else {
              setIsValid(true);
            }
          }
        } else {
          setWarning(result.error || 'Licença não encontrada. Insira sua chave de ativação.');
          setIsValid(false);
        }
      } catch (error) {
        console.error('Erro na validação de licença:', error);
        setWarning('Erro ao validar licença. Verifique sua conexão.');
        setIsValid(false);
      }
    }

    checkLicense();
  }, []);

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Verificando licença...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Licença Inválida</h2>
          <p className="text-slate-600 mb-6">{warning}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
