import { createClient } from '@supabase/supabase-js';

// Using the process.env shim configured in vite.config.ts
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http');

if (!isConfigured) {
  console.warn(
    '⚠️ Supabase Credentials Missing or Invalid! \n' +
    'The app is running in OFFLINE/MOCK MODE. Database features will not persist.\n' +
    'Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// If not configured, we point to a dummy URL to satisfy the client type signature,
// but the app logic should ideally check this connection state.
export const supabase = createClient(
  supabaseUrl || 'https://mock-project.supabase.co', 
  supabaseAnonKey || 'mock-key-placeholder'
);