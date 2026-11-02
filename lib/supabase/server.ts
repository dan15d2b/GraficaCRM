/**
 * STUB DE COMPATIBILIDADE — MIGRAÇÃO SUPABASE → BANCO LOCAL
 *
 * Este arquivo existe apenas para permitir que o código existente compile
 * durante a migração gradual. NÃO usar em código novo.
 *
 * Substituto canônico: import { getSession } from "@/lib/auth/local"
 */

import type { Database } from "@/lib/database.types";

export type { Database };

/**
 * Interface mínima do Supabase Client - suficiente para compilação
 * Baseada na API real do @supabase/supabase-js v2
 */
export interface SupabaseClient {
  from(table: string): any;
  rpc(fn: string, params?: Record<string, any>): any;
  auth: {
    getUser(): Promise<{ data: { user: any }; error: any }>;
    getSession(): Promise<{ data: { session: any }; error: any }>;
    signInWithPassword(credentials: { email: string; password: string }): Promise<{ data: any; error: any }>;
    signInWithOAuth(oauthType: string | { provider: string; options?: any }): Promise<{ data: any; error: any }>;
    signUp(credentials: { email: string; password: string; options?: any }): Promise<{ data: any; error: any }>;
    signInWithProvider(provider: string, options?: any): Promise<{ data: any; error: any }>;
    signOut(options?: { scope?: string }): Promise<{ error: any }>;
    resetPasswordForEmail(email: string, options?: any): Promise<{ data: any; error: any }>;
    updatePassword(newPassword: string): Promise<{ data: any; error: any }>;
    updateUser(attributes: any): Promise<{ data: any; error: any }>;
    verifyOtp(options: { type: string; email?: string; phone?: string; token: string; maxAge?: number }): Promise<{ data: any; error: any }>;
    retryAtToken(options: { email?: string; phone?: string }): Promise<{ data: any; error: any }>;
    refreshSession(): Promise<{ data: any; error: any }>;
    setSession(access_token: string, refresh_token: string): Promise<{ data: any; error: any }>;
    lockInFlow(): Promise<{ error: any }>;
    mfa: {
      listFactors(): Promise<{ data: { totp?: any[]; uri?: string | null; all?: any[] }; error: any }>;
      enroll(params: any): Promise<{ data: any; error: any }>;
      enrollFactor(params: { factorType: string; issuer?: string; accountName?: string; URI?: string; expiredToken?: string }): Promise<{ data: any; error: any }>;
      verify(params: { factorId: string; tmpCode: string; challengeId?: string; code?: string }): Promise<{ data: any; error: any }>;
      unenroll(params: { factorId: string }): Promise<{ data: any; error: any }>;
      challenge(params: { factorId: string }): Promise<{ data: any; error: any }>;
      getAuthenticatorAssuranceLevel(): Promise<{ data: any; error: any }>;
    };
    admin: {
      createUser(user: { email: string; password: string; options?: { data?: any } }): Promise<{ data: any; error: any }>;
      deleteUser(userId: string): Promise<{ data: any; error: any }>;
      updateUserById(userId: string, updates: any): Promise<{ data: any; error: any }>;
      listUsers(request?: { page?: number; perPage?: number }): Promise<{ data: { users: any[] }; error: any }>;
      generateLink(request: { email: string; redirectTo?: string }): Promise<{ data: any; error: any }>;
      inviteUserByEmail(email: string, options?: { redirectTo?: string; data?: any; expireIn?: number }): Promise<{ data: any; error: any }>;
      getUserById(userId: string): Promise<{ data: { user: any }; error: any }>;
      resend(typ: string, email: string): Promise<{ data: any; error: any }>;
      mfa: {
        listFactors: (params: { userId: string }) => Promise<{ data: any; error: any }>;
        deleteFactor: (params: { userId: string; id?: string; factorId?: string }) => Promise<{ data: { id: string }; error: any }>;
      };
    };
  };
  storage: {
    from(bucket: string): {
      upload(path: string, data: any, options?: any): Promise<{ data: any; error: any }>;
      download(path: string): Promise<{ data: any; error: any }>;
      remove(paths: string[]): Promise<{ data: any; error: any }>;
      list(prefix?: string, options?: any): Promise<{ data: any; error: any }>;
      getPublicUrl(path: string): { publicUrl: string };
      create(): Promise<{ data: any; error: any }>;
      updatePublicUrl(bucketId: string, path: string): { publicUrl: string };
      empty(bucketId: string): Promise<{ data: any; error: any }>;
    };
  };
  functions: {
    invoke(name: string, options?: { body?: any; headers?: any }): Promise<{ data: any; error: any }>;
  };
  authUrl?: string;
  storageUrl?: string;
  functionsUrl?: string;
  rest?: any;
  realtime?: any;
  realtimeUrl?: string;
  storageKey?: any;
  headers?: any;
  schema?: any;
  getOpenApiSpec?: () => any;
  supabaseUrl: string;
  supabaseKey: string;
  [_key: string]: any;
}

export type SupabaseServerClient = SupabaseClient;

const STUB_CLIENT: SupabaseServerClient = {
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
      deleteUser: () => Promise.resolve({ data: null, error: null }),
      updateUserById: () => Promise.resolve({ data: null, error: null }),
      listUsers: () => Promise.resolve({ data: { users: [] }, error: null }),
      generateLink: () => Promise.resolve({ data: { properties: { action_link: "" } }, error: null }),
      inviteUserByEmail: () => Promise.resolve({ data: { user: null }, error: null }),
      getUserById: () => Promise.resolve({ data: { user: null }, error: null }),
      resend: () => Promise.resolve({ data: null, error: null }),
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
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  realtime: null,
  realtimeUrl: "",
  storageKey: "",
  headers: {},
  schema: "public",
  getOpenApiSpec: () => null,
};

// Alias para compatibilidade com código existente
export const createClient = (): SupabaseServerClient => STUB_CLIENT;

// Export para Google OAuth específico
export function createClientDeEntradaComGoogle(): SupabaseServerClient {
  return STUB_CLIENT;
}

export async function createServerClient(): Promise<SupabaseServerClient> {
  return STUB_CLIENT;
}

export async function createServerSupabaseClient(): Promise<SupabaseServerClient> {
  return STUB_CLIENT;
}