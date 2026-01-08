import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do diretório atual
  const env = loadEnv(mode, (process as any).cwd(), '');

  console.log("---------------------------------------------------");
  console.log("NEONDASH BUILD CONFIG:");
  console.log("Mode:", mode);
  console.log("Security:", "API Key injection REMOVED. Using Server-Side Proxy.");
  console.log("---------------------------------------------------");

  return {
    plugins: [react()],
    define: {
      // NÃO injetamos mais a API_KEY aqui para evitar vazamento no navegador
      // A comunicação agora será via endpoint /api/ai-proxy
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    server: {
      port: 3000,
      proxy: {
        // Redireciona chamadas locais de /api para as functions (em dev)
        '/api': {
          target: 'http://localhost:3000', // Ajuste conforme seu ambiente de dev serverless se necessário
          changeOrigin: true,
        }
      }
    }
  };
});