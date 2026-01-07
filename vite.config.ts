import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do diretório atual
  const env = loadEnv(mode, (process as any).cwd(), '');

  // FALLBACK DE SEGURANÇA:
  // Chave atualizada para corrigir erro 403
  const apiKey = env.API_KEY || "AIzaSyCZw7K0My40AgnMQFHz-YBdKq3XlAcIjTs";

  console.log("---------------------------------------------------");
  console.log("NEONDASH BUILD CONFIG:");
  console.log("Mode:", mode);
  console.log("API Key Detected:", apiKey ? "YES (Ends with ... " + apiKey.slice(-4) + ")" : "NO");
  console.log("---------------------------------------------------");

  return {
    plugins: [react()],
    define: {
      // Injeta a chave diretamente no código compilado
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    build: {
      outDir: 'dist',
      sourcemap: true // Habilitado para melhor debug
    },
    server: {
      port: 3000,
    }
  };
});