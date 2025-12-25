import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  const apiKey = env.API_KEY || env.VITE_API_KEY || "AIzaSyCNh2pl2VVUhBMnX4xrSIigh3656bkAFrk";
  const vercelKey = env.VERCEL_AI_API_KEY || "vck_89wepKXwO7QbYtJmSiLvhNEaN0ZuaAu20NazAUX9aulBvTwyvZ2UM9AT";
  
  const supabaseUrl = env.VITE_SUPABASE_URL || "https://mzxczamhulpsvswojsod.supabase.co";
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eGN6YW1odWxwc3Zzd29qc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTI2NDQsImV4cCI6MjA4MjE4ODY0NH0.p2YsHlvNMYA-Lm6tLQ7bBPIadr5I_grJzPz63QEI_i0";

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.VERCEL_AI_API_KEY': JSON.stringify(vercelKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    server: {
      port: 3000
    }
  };
});