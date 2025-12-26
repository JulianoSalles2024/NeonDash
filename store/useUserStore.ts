import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, UserHealthMetrics, UserStatus } from '../types';
import { HealthWeights } from './useHealthStore';

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  fetchUsers: () => Promise<void>;
  addUser: (user: Partial<User>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  recalculateAllScores: (weights: HealthWeights) => void;
  resetUsers: () => void;
}

const ensureMetrics = (metrics: any, baseScore: number): UserHealthMetrics => {
  if (metrics && typeof metrics === 'object') return metrics as UserHealthMetrics;
  
  return {
    engagement: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
    support: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
    finance: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
    risk: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
  };
};

export const useUserStore = create<UserState>((set, get) => ({
  users: [], 
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapeamento DB (snake_case) -> Frontend (camelCase)
      const formattedUsers: User[] = (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        company: u.company,
        status: u.status as UserStatus,
        plan: u.plan,
        mrr: u.mrr,
        healthScore: u.health_score,
        lastActive: u.last_active ? new Date(u.last_active).toLocaleDateString() : 'Nunca',
        metrics: u.metrics,
        avatar: `https://ui-avatars.com/api/?name=${u.name}&background=random`,
        tokensUsed: 0 // Campo não persistido na tabela clients atualmente
      }));

      set({ users: formattedUsers });
    } catch (err: any) {
      set({ error: err.message });
      console.error('Error fetching users:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addUser: async (userData) => {
    try {
      const metrics = userData.metrics || ensureMetrics(null, userData.healthScore || 100);
      
      const { data, error } = await supabase
        .from('clients')
        .insert({
          // O ID é gerado automaticamente pelo Auth se for registro, ou pelo banco se for add manual
          // Aqui assumimos adição manual administrativa
          name: userData.name,
          email: userData.email,
          company: userData.company,
          status: userData.status,
          plan: userData.plan,
          mrr: userData.mrr,
          health_score: userData.healthScore || 100,
          metrics: metrics,
          last_active: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const newUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        company: data.company,
        status: data.status as UserStatus,
        plan: data.plan,
        mrr: data.mrr,
        healthScore: data.health_score,
        lastActive: 'Agora',
        metrics: data.metrics,
        avatar: `https://ui-avatars.com/api/?name=${data.name}&background=random`,
        tokensUsed: 0
      };

      set((state) => ({ users: [newUser, ...state.users] }));
    } catch (err) {
      console.error('Error adding user:', err);
    }
  },

  updateUser: async (id, changes) => {
    try {
      // Mapeamento reverso para DB
      const dbChanges: any = { ...changes };
      if (changes.healthScore !== undefined) dbChanges.health_score = changes.healthScore;
      if (changes.lastActive !== undefined) dbChanges.last_active = new Date().toISOString(); // Simplificação

      // Remove campos que não existem no DB
      delete dbChanges.healthScore;
      delete dbChanges.lastActive;
      delete dbChanges.avatar;
      delete dbChanges.tokensUsed;

      const { error } = await supabase
        .from('clients')
        .update(dbChanges)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        users: state.users.map((u) => u.id === id ? { ...u, ...changes } : u)
      }));
    } catch (err) {
      console.error('Error updating user:', err);
    }
  },

  deleteUser: async (id) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;

      set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  },

  resetUsers: async () => {
    // Em modo conectado, não resetamos para Mocks, apenas recarregamos do banco
    const state = get();
    await state.fetchUsers();
  },

  recalculateAllScores: (weights: HealthWeights) => set((state) => {
    // Calculo local para feedback instantâneo na UI
    // Idealmente, isso dispararia uma Edge Function para atualizar o banco em massa
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    
    const updatedUsers = state.users.map(user => {
        const metrics = ensureMetrics(user.metrics, user.healthScore);
        
        let calculatedScore = 0;
        if (totalWeight > 0) {
             calculatedScore = (
                (metrics.engagement * weights.engagement) +
                (metrics.support * weights.support) +
                (metrics.finance * weights.finance) +
                (metrics.risk * weights.risk)
            ) / totalWeight;
        }

        return {
            ...user,
            metrics: metrics,
            healthScore: Math.round(calculatedScore)
        };
    });

    return { users: updatedUsers };
  })
}));