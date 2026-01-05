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
        joinedAt: u.created_at,
        metrics: u.metrics,
        avatar: `https://ui-avatars.com/api/?name=${u.name}&background=random`,
        tokensUsed: 0,
        isTest: u.is_test || false
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
      
      // Fix Timezone: Força meio-dia UTC para evitar que a data volte 1 dia dependendo do fuso horário local
      const safeCreatedAt = userData.joinedAt && userData.joinedAt.length === 10
          ? `${userData.joinedAt}T12:00:00Z`
          : (userData.joinedAt || new Date().toISOString());

      const payload = {
          name: userData.name,
          email: userData.email,
          company: userData.company,
          status: userData.status,
          plan: userData.plan,
          mrr: userData.mrr,
          health_score: userData.healthScore || 100,
          metrics: metrics,
          last_active: new Date().toISOString(),
          created_at: safeCreatedAt,
          is_test: !!userData.isTest
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(payload)
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
        joinedAt: data.created_at,
        metrics: data.metrics,
        avatar: `https://ui-avatars.com/api/?name=${data.name}&background=random`,
        tokensUsed: 0,
        isTest: data.is_test
      };

      set((state) => ({ users: [newUser, ...state.users] }));
    } catch (err) {
      console.error('Error adding user:', err);
      throw err; // Relança para a UI saber que falhou
    }
  },

  updateUser: async (id, changes) => {
    try {
      // WHITELIST STRATEGY: Construímos um objeto APENAS com campos permitidos.
      // Isso evita que campos de UI (como avatar, tokensUsed) quebrem o update no Supabase.
      const dbPayload: any = {};

      if (changes.name !== undefined) dbPayload.name = changes.name;
      if (changes.company !== undefined) dbPayload.company = changes.company;
      if (changes.email !== undefined) dbPayload.email = changes.email;
      if (changes.status !== undefined) dbPayload.status = changes.status;
      if (changes.plan !== undefined) dbPayload.plan = changes.plan;
      if (changes.mrr !== undefined) dbPayload.mrr = changes.mrr;
      if (changes.metrics !== undefined) dbPayload.metrics = changes.metrics;
      
      // Campos mapeados (camelCase -> snake_case)
      if (changes.healthScore !== undefined) dbPayload.health_score = changes.healthScore;
      if (typeof changes.isTest === 'boolean') dbPayload.is_test = changes.isTest;
      
      // Tratamento de Data (Timezone Fix)
      if (changes.joinedAt) {
          if (changes.joinedAt.length === 10) {
              // Se vier do input date (YYYY-MM-DD), adicionamos hora fixa
              dbPayload.created_at = `${changes.joinedAt}T12:00:00Z`;
          } else {
              dbPayload.created_at = changes.joinedAt;
          }
      }

      const { error } = await supabase
        .from('clients')
        .update(dbPayload)
        .eq('id', id);

      if (error) throw error;

      // Atualiza estado local imediatamente (Optimistic UI)
      set((state) => ({
        users: state.users.map((u) => u.id === id ? { ...u, ...changes } : u)
      }));
    } catch (err) {
      console.error('Error updating user:', err);
      throw err; // Relança para a UI exibir a mensagem exata
    }
  },

  deleteUser: async (id) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;

      set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  },

  resetUsers: async () => {
    const state = get();
    await state.fetchUsers();
  },

  recalculateAllScores: (weights: HealthWeights) => set((state) => {
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