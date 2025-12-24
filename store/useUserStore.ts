import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserHealthMetrics } from '../types';
import { MOCK_USERS } from '../constants';
import { HealthWeights } from './useHealthStore';

interface UserState {
  users: User[];
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  resetUsers: () => void;
  recalculateAllScores: (weights: HealthWeights) => void;
}

// Helper to handle legacy data or missing metrics
const ensureMetrics = (user: User): UserHealthMetrics => {
  if (user.metrics) return user.metrics;
  
  // Backward compatibility: Generate plausible metrics if missing based on the old hardcoded score
  const base = user.healthScore || 50;
  return {
    engagement: Math.min(100, Math.max(0, base + (Math.random() * 20 - 10))),
    support: Math.min(100, Math.max(0, base + (Math.random() * 20 - 10))),
    finance: Math.min(100, Math.max(0, base + (Math.random() * 20 - 10))),
    risk: Math.min(100, Math.max(0, base + (Math.random() * 20 - 10))),
  };
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      users: MOCK_USERS, // Initialize with mock data (only used if storage is empty)
      
      addUser: (user) => set((state) => ({ 
        users: [user, ...state.users] 
      })),
      
      updateUser: (id, data) => set((state) => ({
        users: state.users.map((u) => u.id === id ? { ...u, ...data } : u)
      })),
      
      deleteUser: (id) => set((state) => ({
        users: state.users.filter((u) => u.id !== id)
      })),

      resetUsers: () => set({ users: MOCK_USERS }),

      recalculateAllScores: (weights: HealthWeights) => set((state) => {
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        
        const updatedUsers = state.users.map(user => {
            const metrics = ensureMetrics(user);
            
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
                metrics: metrics, // Ensure metrics are saved back if they were generated
                healthScore: Math.round(calculatedScore)
            };
        });

        return { users: updatedUsers };
      })
    }),
    {
      name: 'neondash-users-storage', // unique name in localStorage
    }
  )
);