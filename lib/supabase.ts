import { createClient } from '@supabase/supabase-js';

// Cast import.meta to any to avoid TypeScript errors when vite types are not loaded
const env = (import.meta as any).env;

const supabaseUrl = env?.VITE_SUPABASE_URL;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY;

// Use the detected project URL as fallback, but keep key safe
const fallbackUrl = 'https://mzxczamhulpsvswojsod.supabase.co';
const fallbackKey = 'placeholder-key';

// Helper to check if we are running in a configured environment
export const isSupabaseConfigured = () => {
    return (supabaseAnonKey && supabaseAnonKey !== fallbackKey) || 
           (supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co');
};

const url = supabaseUrl || fallbackUrl;
const key = supabaseAnonKey || fallbackKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL ou Anon Key não configurados. O app pode não funcionar corretamente.');
}

export const supabase = createClient(url, key);