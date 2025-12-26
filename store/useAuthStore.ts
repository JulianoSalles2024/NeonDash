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
  user: User | null;
  isLoading: boolean;
  
  login: (email: string) => Promise<boolean>;
  register: (email: string, name: string, company: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  register: async (email, name, company) => {
    try {
      set({ isLoading: true });
      // A senha padrão é usada apenas para o protótipo. 
      // Em produção, deve haver um campo de senha no formulário.
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'ChangeMe123!', 
        options: {
          data: { name, company, role: 'admin' }
        }
      });

      if (error) throw error;

      // Se o usuário foi criado, também criamos o registro na tabela 'clients'
      // Nota: Idealmente isso é feito via Trigger no banco, mas faremos aqui para garantir a integridade do protótipo
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
      // Usando senha padrão para o fluxo simplificado do protótipo
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