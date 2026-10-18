/**
 * CRMGráfica 2.0 — Layout principal do dashboard
 */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme-provider';
import { LicenseGuard } from '@/components/license/license-guard';
import { Sidebar } from '@/components/Sidebar';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CRMGráfica 2.0',
  description: 'Sistema de gestão comercial para gráficas e comunicação visual',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <LicenseGuard>
            <div className="flex h-screen bg-slate-50">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </LicenseGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
