import { createClient } from '@supabase/supabase-js';

// Tenta obter do import.meta.env (Padrão Vite) ou process.env (Fallback)
// Cast import.meta to any para evitar erros de TS caso a tipagem vite-env.d.ts não exista
const env = (import.meta as any).env || {};

// Prioriza VITE_ prefixado, depois tenta fallback para nomes padrão
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://mzxczamhulpsvswojsod.supabase.co";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eGN6YW1odWxwc3Zzd29qc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTI2NDQsImV4cCI6MjA4MjE4ODY0NH0.p2YsHlvNMYA-Lm6tLQ7bBPIadr5I_grJzPz63QEI_i0";

// Validação simples
const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http');

if (!isConfigured) {
  console.warn(
    '%c⚠️ Supabase Credentials Missing!%c\n' +
    'The app is running in OFFLINE/MOCK MODE.\n' +
    'Database features will not persist. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
    'color: orange; font-weight: bold; font-size: 14px;',
    'color: inherit;'
  );
}

// Inicializa o cliente
// Usa valores placeholder se não houver chaves, evitando crash na inicialização do app
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);