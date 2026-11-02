/**
 * Routes v1 - CRM Gráfica 2.0
 *
 * Centraliza todas as rotas da API v1
 */

import { Hono } from 'hono';

const app = new Hono();

// Setup routes
app.post('/', async (c) => {
  const body = await c.req.json();
  const requestId = c.req.header('x-request-id') || crypto.randomUUID();
  const { POST } = await import('./setup');
  return POST(body, requestId);
});

app.get('/status', async (c) => {
  const { GET } = await import('./setup');
  const result = await GET();
  return c.json(result);
});

// Exportar para uso no server.ts
export default app;