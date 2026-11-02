/**
 * STUB DE COMPATIBILIDADE — MIGRAÇÃO SUPABASE → BANCO LOCAL
 *
 * Cliente admin com service role key — usado para operações que bypassam RLS.
 * Substituto canônico: import { dbQuery, dbExecute, dbTransaction } from "@/lib/db/local"
 */

import type { Database } from "@/lib/database.types";
import type { SupabaseServerClient } from "./server";

export type { Database };

// Type alias for admin client (same structure as server client)
export type SupabaseAdminClient<Schema = Database> = SupabaseServerClient;

const STUB_ADMIN_CLIENT: SupabaseAdminClient = {
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
    eq: () => ({ single: () => ({ data: null, error: null }) }),
  }),
  rpc: () => ({ data: [], error: null }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
    signUp: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithProvider: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
    updatePassword: () => Promise.resolve({ data: null, error: null }),
    updateUser: () => Promise.resolve({ data: null, error: null }),
    verifyOtp: () => Promise.resolve({ data: null, error: null }),
    retryAtToken: () => Promise.resolve({ data: null, error: null }),
    refreshSession: () => Promise.resolve({ data: null, error: null }),
    setSession: () => Promise.resolve({ data: null, error: null }),
    lockInFlow: () => Promise.resolve({ error: null }),
    mfa: {
      listFactors: () => Promise.resolve({ data: { totp: [], uri: null }, error: null }),
      enroll: () => Promise.resolve({ data: null, error: null }),
      enrollFactor: () => Promise.resolve({ data: null, error: null }),
      verify: () => Promise.resolve({ data: null, error: null }),
      unenroll: () => Promise.resolve({ data: null, error: null }),
      challenge: () => Promise.resolve({ data: null, error: null }),
      getAuthenticatorAssuranceLevel: () => Promise.resolve({ data: null, error: null }),
    },
    admin: {
      createUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getUserById: () => Promise.resolve({ data: { user: null }, error: null }),
      deleteUser: () => Promise.resolve({ data: null, error: null }),
      updateUserById: () => Promise.resolve({ data: null, error: null }),
      listUsers: () => Promise.resolve({ data: { users: [] }, error: null }),
      generateLink: () => Promise.resolve({ data: { properties: { action_link: "" } }, error: null }),
      inviteUserByEmail: () => Promise.resolve({ data: { user: null }, error: null }),
      resend: () => Promise.resolve({ data: null, error: null }),
      mfa: {
        listFactors: () => Promise.resolve({ data: { factors: [], totp: [], uri: null }, error: null }),
        deleteFactor: () => Promise.resolve({ data: { id: "" }, error: null }),
      },
    },
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: { publicUrl: "" }, error: null }),
      download: () => Promise.resolve({ data: null, error: null }),
      remove: () => Promise.resolve({ data: [], error: null }),
      list: () => Promise.resolve({ data: [], error: null }),
      getPublicUrl: () => ({ publicUrl: "" }),
      create: () => Promise.resolve({ data: null, error: null }),
      updatePublicUrl: () => ({ publicUrl: "" }),
      empty: () => Promise.resolve({ data: null, error: null }),
    }),
  },
  functions: {
    invoke: () => Promise.resolve({ data: null, error: null }),
  },
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_KEY || "",
  realtime: null,
  realtimeUrl: "",
  storageKey: "",
  headers: {},
  schema: "public",
  getOpenApiSpec: () => null,
};

export function createAdminClient(): SupabaseAdminClient {
  return STUB_ADMIN_CLIENT;
}

// Exporta instância singleton
export const supabaseAdmin = createAdminClient();

// Alias para compatibilidade
export const supabaseAdminClient = createAdminClient();