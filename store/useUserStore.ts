import { create } from 'zustand';
import { User, UserHealthMetrics, UserStatus } from '../types';
import { HealthWeights } from './useHealthStore';
import { supabase } from '../lib/supabase';
import { MOCK_USERS } from '../constants';

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  fetchUsers: () => Promise<void>;
  addUser: (user: Partial<User>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // Local actions (Calculation engine)
  recalculateAllScores: (weights: HealthWeights) => void;
  resetUsers: () => void;
}

// Helper: Ensure Metrics exist
const ensureMetrics = (metrics: any, baseScore: number): UserHealthMetrics => {
  if (metrics && typeof metrics === 'object') return metrics as UserHealthMetrics;
  
  // Default metrics if missing
  return {
    engagement: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
    support: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
    finance: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
    risk: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
  };
};

// Helper: Map Supabase snake_case to Frontend camelCase
const mapFromDb = (dbUser: any): User => ({
    id: dbUser.id,
    name: dbUser.name,
    company: dbUser.company,
    email: dbUser.email,
    avatar: dbUser.avatar || `https://ui-avatars.com/api/?name=${dbUser.name}&background=random`,
    status: dbUser.status as UserStatus,
    plan: dbUser.plan,
    lastActive: dbUser.last_active || 'Desconhecido',
    healthScore: dbUser.health_score ?? 50,
    mrr: dbUser.mrr ?? 0,
    tokensUsed: dbUser.tokens_used ?? 0,
    metrics: ensureMetrics(dbUser.metrics, dbUser.health_score ?? 50)
});

// Helper: Check if ID is a valid UUID (Real DB ID) vs Mock ID
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export const useUserStore = create<UserState>((set, get) => ({
  users: [], // Start empty, fetch on mount
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Supabase fetch failed, falling back to mocks.", error);
            // Fallback to mocks on error
            set({ users: MOCK_USERS });
            return;
        }

        // Use DB data if available, otherwise fallback to mocks for demo purposes
        if (data && data.length > 0) {
            set({ users: data.map(mapFromDb) });
        } else {
            console.log("No users in DB, loading mocks.");
            set({ users: MOCK_USERS });
        }
    } catch (err: any) {
        console.error('Error fetching users:', err);
        set({ error: err.message, users: MOCK_USERS }); 
    } finally {
        set({ isLoading: false });
    }
  },

  addUser: async (userData) => {
    // Optimistic Update (Temporary ID for UI responsiveness)
    const tempId = Date.now().toString();
    const newUser = { 
        ...userData, 
        id: tempId,
        metrics: userData.metrics || ensureMetrics(null, userData.healthScore || 100),
        lastActive: 'Agora',
        tokensUsed: 0
    } as User;

    set((state) => ({ users: [newUser, ...state.users] }));

    // Map to DB format
    const dbPayload = {
        name: userData.name,
        company: userData.company,
        email: userData.email,
        status: userData.status,
        plan: userData.plan,
        mrr: userData.mrr,
        health_score: userData.healthScore || 100,
        tokens_used: 0,
        last_active: 'Agora',
        metrics: newUser.metrics
    };

    const { data, error } = await supabase.from('clients').insert(dbPayload).select().single();

    if (error) {
        console.error("Error adding user to DB (keeping optimistic local update):", error);
        // We keep the optimistic update so the UI doesn't break in demo mode
        return;
    }

    // Replace optimistic user with real DB user (correct UUID)
    if (data) {
        set((state) => ({
            users: state.users.map(u => u.id === tempId ? mapFromDb(data) : u)
        }));
    }
  },

  updateUser: async (id, changes) => {
    // 1. Optimistic Update
    set((state) => ({
        users: state.users.map((u) => u.id === id ? { ...u, ...changes } : u)
    }));

    // If it's not a UUID, it's a mock user. We don't send to DB, just keep local state updated.
    if (!isUUID(id)) return;

    // 2. Prepare DB Payload
    const dbPayload: any = {};
    if (changes.name) dbPayload.name = changes.name;
    if (changes.company) dbPayload.company = changes.company;
    if (changes.email) dbPayload.email = changes.email;
    if (changes.status) dbPayload.status = changes.status;
    if (changes.plan) dbPayload.plan = changes.plan;
    if (changes.mrr !== undefined) dbPayload.mrr = changes.mrr;
    if (changes.healthScore !== undefined) dbPayload.health_score = changes.healthScore;
    if (changes.metrics) dbPayload.metrics = changes.metrics;
    
    // 3. Send to DB
    const { error } = await supabase.from('clients').update(dbPayload).eq('id', id);
    
    if (error) {
        console.error("Error updating user:", error);
    }
  },

  deleteUser: async (id) => {
    // Optimistic Delete
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
    
    // If it's a mock user (not a UUID), don't send to DB
    if (!isUUID(id)) {
        return;
    }

    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
        console.error("Error deleting user from DB:", error);
    }
  },

  resetUsers: () => {
    set({ users: MOCK_USERS });
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