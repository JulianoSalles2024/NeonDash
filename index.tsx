import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Importação essencial para o Tailwind funcionar
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter as Router } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <App />
      </Router>
    </QueryClientProvider>
  </React.StrictMode>
);