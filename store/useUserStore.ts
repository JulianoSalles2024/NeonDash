import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserHealthMetrics } from '../types';
import { HealthWeights } from './useHealthStore';
import { MOCK_USERS } from '../constants';

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  isInitialized: boolean; // Flag para controlar se os mocks já foram carregados
  
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

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [], 
      isLoading: false,
      error: null,
      hasHydrated: false,
      isInitialized: false,

      fetchUsers: async () => {
        const state = get();
        
        // CORREÇÃO: Só carrega os Mocks se a store NUNCA tiver sido inicializada antes.
        // Se o usuário deletar todos os usuários, 'users' será [], mas 'isInitialized' será true,
        // então não recarregaremos os mocks automaticamente.
        if (!state.isInitialized) {
            console.log("Primeira inicialização: Carregando dados de exemplo...");
            set({ users: MOCK_USERS, isInitialized: true, hasHydrated: true });
        } else {
            // Já foi inicializado anteriormente, mantemos os dados do localStorage (mesmo que vazio)
            set({ hasHydrated: true });
        }
      },

      addUser: async (userData) => {
        const tempId = Date.now().toString();
        const newUser = { 
            ...userData, 
            id: tempId,
            metrics: userData.metrics || ensureMetrics(null, userData.healthScore || 100),
            lastActive: 'Agora',
            tokensUsed: 0
        } as User;

        set((state) => ({ users: [newUser, ...state.users] }));
      },

      updateUser: async (id, changes) => {
        set((state) => ({
            users: state.users.map((u) => u.id === id ? { ...u, ...changes } : u)
        }));
      },

      deleteUser: async (id) => {
        set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
      },

      resetUsers: () => {
        // Função para forçar o reset manualmente (botão nas configurações)
        set({ users: MOCK_USERS, isInitialized: true, hasHydrated: true });
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
    }),
    {
      name: 'neondash-users-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);