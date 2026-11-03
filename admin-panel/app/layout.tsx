import { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRM Gráfica - Painel Admin',
  description: 'Painel administrativo para gestão de licenças e servidores',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}