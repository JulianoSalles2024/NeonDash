import { createClient } from '@supabase/supabase-js';

// Tenta obter do process.env (injetado pelo Vite) ou usa o fallback direto do projeto
// Isso garante que o app funcione mesmo se o usuário esquecer o arquivo .env
const supabaseUrl = process.env.SUPABASE_URL || "https://mzxczamhulpsvswojsod.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eGN6YW1odWxwc3Zzd29qc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTI2NDQsImV4cCI6MjA4MjE4ODY0NH0.p2YsHlvNMYA-Lm6tLQ7bBPIadr5I_grJzPz63QEI_i0";

// Validação simples
const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http');

if (!isConfigured) {
  console.warn(
    '⚠️ Supabase Credentials Missing or Invalid! \n' +
    'The app is running in OFFLINE/MOCK MODE. Database features will not persist.\n' +
    'Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Inicializa o cliente com as credenciais resolvidas
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);