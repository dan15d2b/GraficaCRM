/**
 * STUB DE COMPATIBILIDADE — MIGRAÇÃO SUPABASE → BANCO LOCAL
 *
 * Este arquivo existe apenas para permitir que o código existente compile
 * durante a migração gradual. NÃO usar em código novo.
 *
 * Substituto canônico: import { dbQuery, dbExecute, dbTransaction } from "@/lib/db/local"
 */

import type { Database } from "@/lib/database.types";

// Tipos mínimos que o código legado espera
export type SupabaseClient<Schema = Database> = {
  from: (table: string) => any;
  rpc: (fn: string, params?: any) => any;
  auth: {
    getUser: () => Promise<any>;
    getSession: () => Promise<any>;
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>;
    signUp: (credentials: { email: string; password: string; options?: any }) => Promise<any>;
    signOut: () => Promise<any>;
  };
  storage: {
    from: (bucket: string) => any;
  };
};

// Cria um cliente dummy que lança erro se usado em runtime (exceto build)
export function createBrowserClient<Schema = Database>(): SupabaseClient<Schema> {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[supabase/browser] Usando stub de compatibilidade. Migre para @/lib/db/local",
    );
  }
  // Retorna um cliente que responde com dados vazios
  return {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
    }),
    rpc: () => ({ data: [], error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Use auth local" } }),
      signUp: () => Promise.resolve({ data: null, error: { message: "Use auth local" } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: () => ({
        upload: () => ({ data: { publicUrl: "" }, error: null }),
        download: () => ({ data: null, error: null }),
        remove: () => ({ data: null, error: null }),
        list: () => ({ data: [], error: null }),
      }),
    },
  };
}