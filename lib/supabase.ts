import { createClient } from '@supabase/supabase-js';

// Cast import.meta to any to avoid TypeScript errors when vite types are not loaded
const env = (import.meta as any).env;

const supabaseUrl = env?.VITE_SUPABASE_URL;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL ou Anon Key não configurados. Verifique seu arquivo .env');
}

// Fallback to prevent crash if keys are missing (development/setup phase)
// Using a valid URL format to satisfy the constructor validation
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(url, key);