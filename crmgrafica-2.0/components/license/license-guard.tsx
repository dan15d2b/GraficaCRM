/**
 * CRMGráfica 2.0 — Guardião de Licenciamento
 * 
 * Verifica a validade da licença antes de permitir acesso ao sistema.
 */
'use client';

import { useEffect, useState } from 'react';
import { getLicenseClient } from '@/lib/license';
import { useRouter } from 'next/navigation';

export function LicenseGuard({ children }: { children: React.ReactNode }) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [warning, setWarning] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    async function checkLicense() {
      try {
        const licenseClient = getLicenseClient();
        // TODO: Buscar licença do storage/localStorage
        const result = await licenseClient.validate('DEMO_KEY', 'demo-org');
        
        if (result.success && result.license) {
          if (result.license.blocked) {
            setWarning(result.license.blockedReason || 'Licença bloqueada');
            setIsValid(false);
          } else if (result.license.expiresAt < new Date()) {
            setWarning('Licença expirada. Entre em contato com o suporte.');
            setIsValid(false);
          } else {
            setIsValid(true);
          }
        } else {
          setWarning('Licença não encontrada. Insira sua chave de ativação.');
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
