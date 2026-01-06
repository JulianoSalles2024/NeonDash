import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useEventStore } from './useEventStore';

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
  isCheckingAuth: true, 
  user: null,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsCheckingAuth: (loading) => set({ isCheckingAuth: loading }),

  register: async (email, name, company) => {
    try {
      set({ isLoading: true });

      try {
        const response = await fetch('/api/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'ChangeMe123!', name, company, role: 'admin' })
        });

        if (response.ok) {
            await get().login(email);
            return true;
        }
      } catch (e) {
        console.warn('API Registration skipped, falling back to client-side auth.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'ChangeMe123!', 
        options: {
          data: { name, company, role: 'admin' }
        }
      });

      if (error) throw error;

      if (data.user) {
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
        const user = {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata.name || 'Admin',
            company: data.user.user_metadata.company || 'Neon HQ',
            role: data.user.user_metadata.role || 'admin' as const
        };

        set({
          isAuthenticated: true,
          user: user
        });

        useEventStore.getState().addEvent({
            level: 'info',
            title: 'Login Detectado',
            description: `${user.name} iniciou sessão no painel.`,
            source: 'Auth Check'
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
    const user = get().user;
    if (user) {
        useEventStore.getState().addEvent({
            level: 'info',
            title: 'Logout',
            description: `${user.name} encerrou a sessão.`,
            source: 'System'
        });
    }
    await supabase.auth.signOut();
    set({ isAuthenticated: false, user: null });
    localStorage.removeItem('neondash-snapshots');
  }
}));