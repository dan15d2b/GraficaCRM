/**
 * CRMGráfica 2.0 — Layout para páginas de autenticação
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - CRMGráfica 2.0',
  description: 'Acesso ao sistema',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
