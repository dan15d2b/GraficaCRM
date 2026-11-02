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
  // Propriedades compatíveis com Supabase client
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
  },
});

// Admin é apenas um alias para a função local do banco
export const getSupabaseAdmin = async () => {
  // Dynamic import evita que o bundler carregue lib/db/local.ts no client
  const db = await import("@/lib/db/local");
  return db.getLocalDB();
};

// Alias para compatibilidade com código antigo
export const createClient = getServerSupabase;
export const getUrlDoServidor = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";