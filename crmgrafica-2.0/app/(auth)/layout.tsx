/**
 * CRMGráfica 2.0 — Layout para páginas de autenticação
 */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme-provider';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-slate-50">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
