/**
 * CRM Gráfica 2.0 - Backend API Entry Point (Node.js Standalone)
 *
 * Server HTTP simples que substitui Next.js API Routes
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from './lib/logger';

// Criar app Hono
const app = new Hono();

// ===== MIDDLEWARE GLOBAL =====

// Verificar se setup foi completado via SQLite
app.use('*', async (c, next) => {
  const pathname = c.req.path;
  const isSetupRoute = pathname.startsWith('/api/v1/setup');

  if (!isSetupRoute) {
    try {
      const { isSetupComplete } = await import('./lib/db/local');
      const done = await isSetupComplete();
      if (!done) {
        return c.json({
          error: { code: 'setup_required', message: 'Sistema não configurado. Complete a instalação em /setup' }
        }, 503);
      }
    } catch (e) {
      logger.warn('Setup status não disponível', { error: String(e) });
    }
  }
  return next();
});

// ===== ROTAS =====

// Health check
app.get('/api/v1/health', (c) => {
  return c.json({
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  });
});

// Setup routes
app.post('/api/v1/setup', async (c) => {
  try {
    const body = await c.req.json();
    const requestId = c.req.header('x-request-id') || crypto.randomUUID();
    const { POST } = await import('./routes/v1/setup');
    return POST(body, requestId);
  } catch (e) {
    return new Response(JSON.stringify({ error: { code: 'invalid_json', message: 'Body inválido' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

app.get('/api/v1/setup/status', async (c) => {
  const { GET } = await import('./routes/v1/setup');
  const result = await GET();
  return c.json(result);
});

// ===== SERVIDOR =====

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

logger.info('Iniciando backend CRM Gráfica 2.0 (Hono)', { port });

serve({
  fetch: app.fetch,
  port
}, (info) => {
  logger.info('Servidor iniciado', {
    url: `http://localhost:${info.port}`,
    timestamp: new Date().toISOString()
  });
});