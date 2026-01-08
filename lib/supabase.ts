import { createClient } from '@supabase/supabase-js';

// Função auxiliar para acessar variáveis de ambiente de forma segura
// Evita o erro: Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL ou Anon Key não configurados. Verifique seu arquivo .env');
}

// Fallback para evitar crash imediato se as chaves estiverem faltando
// Usamos um domínio fictício válido para evitar erros de DNS se a URL for undefined
const url = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(url, key);