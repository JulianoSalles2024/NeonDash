import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do diretório atual
  // O terceiro argumento '' garante que carregue variáveis sem prefixo VITE_
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Define a variável global process.env.API_KEY com o valor do arquivo .env
      // O JSON.stringify é crucial para que o valor seja inserido como string no código final
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    server: {
      port: 3000,
    }
  };
});