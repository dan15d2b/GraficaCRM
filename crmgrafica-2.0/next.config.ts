import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  turbopack: {
    root: '/home/daniel/Área de trabalho/GraficaCRM-main/crmgrafica-2.0',
  },
};

export default nextConfig;
