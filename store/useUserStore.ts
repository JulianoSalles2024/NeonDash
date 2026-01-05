import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, UserHealthMetrics, UserStatus, UserEvent } from '../types';
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

// Helper para gerar eventos baseados nas mudanças
const generateEventFromChanges = (changes: Partial<User>, currentUser: User): UserEvent | null => {
    const now = new Date().toLocaleString('pt-BR');
    const id = Date.now().toString();

    if (changes.lastActive && changes.lastActive !== currentUser.lastActive) {
        // Formata data ISO para legível se possível
        let dateDisplay = changes.lastActive;
        try {
            if (changes.lastActive.includes('-')) {
                const d = new Date(changes.lastActive);
                dateDisplay = d.toLocaleDateString() + ' às ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        } catch (e) {}

        return {
            id,
            type: 'info',
            title: 'Acesso Registrado',
            description: `Última atividade atualizada manualmente para ${dateDisplay}.`,
            timestamp: now
        };
    }

    if (changes.status && changes.status !== currentUser.status) {
        const type = changes.status === UserStatus.CHURNED ? 'error' : 
                     changes.status === UserStatus.ACTIVE ? 'success' : 'warning';
        return {
            id,
            type,
            title: 'Alteração de Status',
            description: `Status do usuário alterado de "${currentUser.status}" para "${changes.status}".`,
            timestamp: now
        };
    }

    if (changes.plan && changes.plan !== currentUser.plan) {
        return {
            id,
            type: 'success',
            title: 'Mudança de Plano',
            description: `Plano atualizado para ${changes.plan}.`,
            timestamp: now
        };
    }

    if (changes.healthScore !== undefined && Math.abs(changes.healthScore - currentUser.healthScore) > 10) {
        const isDrop = changes.healthScore < currentUser.healthScore;
        return {
            id,
            type: isDrop ? 'warning' : 'success',
            title: 'Health Score Atualizado',
            description: `A pontuação de saúde ${isDrop ? 'caiu' : 'subiu'} para ${changes.healthScore}.`,
            timestamp: now
        };
    }

    // Generic fallback for other significant changes could go here
    return null;
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
        // Mantém formato ISO cru ou 'Nunca' para permitir ordenação correta na UI
        lastActive: u.last_active || 'Nunca',
        joinedAt: u.created_at,
        metrics: u.metrics,
        avatar: `https://ui-avatars.com/api/?name=${u.name}&background=random`,
        tokensUsed: 0,
        // Mapeamento direto da coluna
        isTest: u.is_test || false,
        // Recupera churnReason de dentro das métricas (JSON)
        churnReason: u.metrics?.churnReason || '',
        // Recupera histórico de dentro das métricas (JSON)
        history: u.metrics?.history || []
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
      // Injeta churnReason dentro das métricas para persistência sem migration
      const baseMetrics = userData.metrics || ensureMetrics(null, userData.healthScore || 100);
      
      const initialHistory: UserEvent[] = [{
          id: Date.now().toString(),
          type: 'success',
          title: 'Usuário Criado',
          description: 'Cadastro realizado no sistema.',
          timestamp: new Date().toLocaleString('pt-BR')
      }];

      const metricsWithData = {
          ...baseMetrics,
          churnReason: userData.churnReason,
          history: initialHistory
      };

      // Fix Timezone: Força meio-dia UTC para evitar que a data volte 1 dia
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
          metrics: metricsWithData,
          last_active: new Date().toISOString(),
          created_at: safeCreatedAt,
          is_test: !!userData.isTest // Grava na coluna dedicada
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
        isTest: data.is_test,
        churnReason: data.metrics?.churnReason,
        history: data.metrics?.history
      };

      set((state) => ({ users: [newUser, ...state.users] }));
    } catch (err) {
      console.error('Error adding user:', err);
      throw err;
    }
  },

  updateUser: async (id, changes) => {
    try {
      const state = get();
      const currentUser = state.users.find(u => u.id === id);
      if (!currentUser) return;

      // 1. Gera Evento de Histórico
      const newEvent = generateEventFromChanges(changes, currentUser);
      
      // 2. Prepara nova lista de histórico
      let updatedHistory = currentUser.history || [];
      if (newEvent) {
          updatedHistory = [newEvent, ...updatedHistory];
      }

      const dbPayload: any = {};

      if (changes.name !== undefined) dbPayload.name = changes.name;
      if (changes.company !== undefined) dbPayload.company = changes.company;
      if (changes.email !== undefined) dbPayload.email = changes.email;
      if (changes.status !== undefined) dbPayload.status = changes.status;
      if (changes.plan !== undefined) dbPayload.plan = changes.plan;
      if (changes.mrr !== undefined) dbPayload.mrr = changes.mrr;
      if (changes.healthScore !== undefined) dbPayload.health_score = changes.healthScore;
      
      // Mapeamento direto para a coluna
      if (changes.isTest !== undefined) dbPayload.is_test = changes.isTest;
      
      // Update last_active directly if provided
      if (changes.lastActive !== undefined) dbPayload.last_active = changes.lastActive;

      // Tratamento especial para metrics, churnReason e HISTORY
      // Precisamos mesclar porque tudo vive dentro do JSON metrics no DB
      const currentMetrics = currentUser.metrics || ensureMetrics(null, 100);
      const newMetricsBase = changes.metrics || currentMetrics;
          
      // Se o status mudou para algo que não é churn, limpamos o motivo
      // Se o usuário explicitamente mudou o motivo, usamos o novo
      let finalChurnReason = changes.churnReason;
      if (changes.status && changes.status !== UserStatus.CHURNED) {
          finalChurnReason = '';
      } else if (finalChurnReason === undefined) {
          finalChurnReason = currentUser.churnReason;
      }

      dbPayload.metrics = {
          ...newMetricsBase,
          churnReason: finalChurnReason,
          history: updatedHistory // Persiste o histórico atualizado
      };
      
      // Tratamento de Data
      if (changes.joinedAt) {
          if (changes.joinedAt.length === 10) {
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

      // Atualiza estado local
      set((state) => ({
        users: state.users.map((u) => u.id === id ? { 
            ...u, 
            ...changes,
            history: updatedHistory 
        } : u)
      }));
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
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