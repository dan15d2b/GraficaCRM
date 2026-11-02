/**
 * Compatibilidade shim — redireciona para o banco local SQLite
 *
 * Este arquivo mantém a compatibilidade de imports com o código antigo
 * que ainda usa `@/lib/supabase/admin`. A partir de 2026, o CRM usa
 * SQLite embutido via lib/db/local.ts.
 *
 * ⚠️ Para novos código, use lib/auth/local.ts e lib/db/local.ts diretamente.
 */

// Admin é apenas um alias para a função local do banco
export const getSupabaseAdmin = async () => {
  const db = await import("@/lib/db/local");
  return db.getLocalDB();
};

// Tipo simplificado para compatibilidade
export type SupabaseClient = ReturnType<typeof getSupabaseAdmin>;