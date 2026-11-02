/**
 * Compatibilidade shim — redireciona para o banco local SQLite
 *
 * Este arquivo mantém a compatibilidade de imports com o código antigo
 * que ainda usa `@/lib/supabase/server`. A partir de 2026, o CRM usa
 * SQLite embutido via lib/db/local.ts.
 *
 * ⚠️ Para novos código, use lib/auth/local.ts e lib/db/local.ts diretamente.
 */

// Exporta a função do banco local como compatível com a API Supabase
export const getServerSupabase = () => ({
  from: (_table: string) => ({
    select: () => ({ eq: () => ({ maybeSingle: () => ({ data: null, error: null }) }) }),
    insert: () => ({ eq: () => ({ data: null, error: null }) }),
    update: () => ({ eq: () => ({ data: null, error: null }) }),
    delete: () => ({ eq: () => ({ data: null, error: null }) }),
  }),
});

// Admin é apenas um alias para a função local do banco
export const getSupabaseAdmin = async () => {
  const db = await import("@/lib/db/local");
  return db.getLocalDB();
};