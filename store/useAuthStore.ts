import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: 'admin' | 'viewer';
}

interface AuthState {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  user: User | null;
  isLoading: boolean;
  
  login: (email: string) => Promise<boolean>;
  register: (email: string, name: string, company: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setIsCheckingAuth: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isCheckingAuth: true, // Começa true para evitar redirect prematuro
  user: null,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsCheckingAuth: (loading) => set({ isCheckingAuth: loading }),

  register: async (email, name, company) => {
    try {
      set({ isLoading: true });

      // 1. Tentar registrar via API (Bypass de confirmação de email via Admin API se disponível)
      try {
        const response = await fetch('/api/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'ChangeMe123!', name, company, role: 'admin' })
        });

        if (response.ok) {
            // Se sucesso via API, fazemos login automático
            await get().login(email);
            return true;
        }
      } catch (e) {
        console.warn('API Registration skipped, falling back to client-side auth.');
      }

      // 2. Fallback para Auth Cliente Padrão (Pode exigir confirmação de email dependendo do projeto)
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'ChangeMe123!', 
        options: {
          data: { name, company, role: 'admin' }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Tenta inserir no banco público caso o trigger não exista
        await supabase.from('clients').insert({
          id: data.user.id,
          email: email,
          name: name,
          company: company,
          status: 'Novo',
          plan: 'Starter',
          health_score: 100,
          mrr: 0,
          metrics: { engagement: 50, support: 50, finance: 50, risk: 50 }
        });
        
        // Se a sessão foi criada (email confirm off), loga o usuário
        if (data.session) {
            get().setUser({
                id: data.user.id,
                email: data.user.email!,
                name: name,
                company: company,
                role: 'admin'
            });
            return true;
        }
      }

      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email) => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'ChangeMe123!' 
      });

      if (error) throw error;

      if (data.user) {
        set({
          isAuthenticated: true,
          user: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata.name || 'Admin',
            company: data.user.user_metadata.company || 'Neon HQ',
            role: data.user.user_metadata.role || 'admin'
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, user: null });
    localStorage.removeItem('neondash-snapshots');
  }
}));