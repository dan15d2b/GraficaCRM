/**
 * CRMGráfica 2.0 — Cliente Supabase (Server)
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const createServerClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase credentials not configured');
    return null;
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
};
