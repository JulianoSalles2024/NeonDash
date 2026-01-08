import { createClient } from '@supabase/supabase-js';

// Função auxiliar para acessar variáveis de ambiente de forma segura
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key];
  }
  return undefined;
};

// --- CREDENCIAIS DE FALLBACK ---
// Inseridas diretamente para garantir que o app funcione mesmo se o .env falhar
const HARDCODED_URL = "https://mzxczamhulpsvswojsod.supabase.co";
const HARDCODED_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eGN6YW1odWxwc3Zzd29qc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTI2NDQsImV4cCI6MjA4MjE4ODY0NH0.p2YsHlvNMYA-Lm6tLQ7bBPIadr5I_grJzPz63QEI_i0";

// Tenta pegar do .env, se falhar (undefined ou string vazia), usa as credenciais diretas
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || HARDCODED_URL;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || HARDCODED_ANON;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Credenciais Supabase críticas ausentes.');
} else {
  console.log('✅ Supabase conectado com sucesso via', getEnv('VITE_SUPABASE_URL') ? 'Variáveis de Ambiente' : 'Fallback Hardcoded');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);