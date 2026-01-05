import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, UserHealthMetrics, UserStatus, UserEvent } from '../types';
import { HealthWeights } from './useHealthStore';
import { useEventStore } from './useEventStore';

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
        let dateDisplay = changes.lastActive;
        try {
            if (changes.lastActive.includes('-')) {
                const d = new Date(changes.lastActive);
                dateDisplay = d.toLocaleDateString() + ' às ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        } catch (e) {}

        // Dispara evento global
        useEventStore.getState().addEvent({
            level: 'info',
            title: 'Atividade de Usuário',
            description: `${currentUser.name} registrou acesso em ${dateDisplay}.`,
            source: 'Activity',
        });

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
        
        // Dispara evento global
        useEventStore.getState().addEvent({
            level: changes.status === UserStatus.CHURNED ? 'critical' : changes.status === UserStatus.RISK ? 'warning' : 'success',
            title: `Mudança de Status: ${changes.status}`,
            description: `${currentUser.name} mudou de ${currentUser.status} para ${changes.status}.`,
            source: 'CRM',
            action: changes.status === UserStatus.RISK ? 'Verificar' : undefined
        });

        return {
            id,
            type,
            title: 'Alteração de Status',
            description: `Status do usuário alterado de "${currentUser.status}" para "${changes.status}".`,
            timestamp: now
        };
    }

    if (changes.plan && changes.plan !== currentUser.plan) {
        useEventStore.getState().addEvent({
            level: 'success',
            title: 'Upgrade/Downgrade',
            description: `${currentUser.name} alterou o plano para ${changes.plan}.`,
            source: 'Billing',
            action: 'Fatura'
        });

        return {
            id,
            type: 'success',
            title: 'Mudança de Plano',
            description: `Plano atualizado para ${changes.plan}.`,
            timestamp: now
        };
    }

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

      const formattedUsers: User[] = (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        company: u.company,
        status: u.status as UserStatus,
        plan: u.plan,
        mrr: u.mrr,
        healthScore: u.health_score,
        lastActive: u.last_active || 'Nunca',
        joinedAt: u.created_at,
        metrics: u.metrics,
        avatar: `https://ui-avatars.com/api/?name=${u.name}&background=random`,
        tokensUsed: 0,
        isTest: u.is_test || false,
        churnReason: u.metrics?.churnReason || '',
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
        isTest: data.is_test,
        churnReason: data.metrics?.churnReason,
        history: data.metrics?.history
      };

      // Dispara evento global
      useEventStore.getState().addEvent({
          level: 'success',
          title: 'Novo Cliente',
          description: `${newUser.name} (${newUser.company}) entrou na plataforma.`,
          source: 'Growth',
          action: 'Onboarding'
      });

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

      const newEvent = generateEventFromChanges(changes, currentUser);
      
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
      if (changes.isTest !== undefined) dbPayload.is_test = changes.isTest;
      if (changes.lastActive !== undefined) dbPayload.last_active = changes.lastActive;

      const currentMetrics = currentUser.metrics || ensureMetrics(null, 100);
      const newMetricsBase = changes.metrics || currentMetrics;
          
      let finalChurnReason = changes.churnReason;
      if (changes.status && changes.status !== UserStatus.CHURNED) {
          finalChurnReason = '';
      } else if (finalChurnReason === undefined) {
          finalChurnReason = currentUser.churnReason;
      }

      dbPayload.metrics = {
          ...newMetricsBase,
          churnReason: finalChurnReason,
          history: updatedHistory
      };
      
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
      const state = get();
      const user = state.users.find(u => u.id === id);
      
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;

      if (user) {
          useEventStore.getState().addEvent({
              level: 'warning',
              title: 'Usuário Excluído',
              description: `O registro de ${user.name} foi removido permanentemente.`,
              source: 'System'
          });
      }

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