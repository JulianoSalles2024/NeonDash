import { createClient } from '@supabase/supabase-js';

// Cast import.meta to any to avoid TypeScript errors when vite types are not loaded
const env = (import.meta as any).env;

const supabaseUrl = env?.VITE_SUPABASE_URL || 'https://mzxczamhulpsvswojsod.supabase.co';
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eGN6YW1odWxwc3Zzd29qc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTI2NDQsImV4cCI6MjA4MjE4ODY0NH0.p2YsHlvNMYA-Lm6tLQ7bBPIadr5I_grJzPz63QEI_i0';

if (!supabaseAnonKey) {
  console.warn('VITE_SUPABASE_ANON_KEY é obrigatório para funcionamento completo');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);