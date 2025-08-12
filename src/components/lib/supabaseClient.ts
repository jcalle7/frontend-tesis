import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// SINGLETON en globalThis para evitar duplicados con HMR
const g = globalThis as any;

export const supabase =
  g.__sb ??
  (g.__sb = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'sb-auth',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }));
