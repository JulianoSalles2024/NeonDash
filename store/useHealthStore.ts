import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface HealthFactors {
  engagement: number;
  support: number;
  finance: number;
  risk: number;
}

export interface HealthWeights {
  engagement: number;
  support: number;
  finance: number;
  risk: number;
}

interface HealthState {
  factors: HealthFactors;
  weights: HealthWeights;
  globalScore: number;
  isEditingWeights: boolean;
  toggleEditWeights: () => void;
  setWeight: (key: keyof HealthWeights, value: number) => void;
  resetDefaults: () => void;
}

const DEFAULT_FACTORS = {
  engagement: 88,
  support: 95,
  finance: 100,
  risk: 72
};

const DEFAULT_WEIGHTS = {
  engagement: 40,
  support: 20,
  finance: 30,
  risk: 10
};

const calculateScore = (factors: HealthFactors, weights: HealthWeights) => {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return 0;

    const weightedSum =
        (factors.engagement * weights.engagement) +
        (factors.support * weights.support) +
        (factors.finance * weights.finance) +
        (factors.risk * weights.risk);

    return Math.round(weightedSum / totalWeight);
};

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      factors: DEFAULT_FACTORS,
      weights: DEFAULT_WEIGHTS,
      globalScore: calculateScore(DEFAULT_FACTORS, DEFAULT_WEIGHTS),
      isEditingWeights: false,

      toggleEditWeights: () => set((state) => ({ isEditingWeights: !state.isEditingWeights })),

      setWeight: (key, value) => {
          const { factors, weights } = get();
          const newWeights = { ...weights, [key]: value };
          set({
              weights: newWeights,
              globalScore: calculateScore(factors, newWeights)
          });
      },

      resetDefaults: () => {
          set({
              factors: DEFAULT_FACTORS,
              weights: DEFAULT_WEIGHTS,
              globalScore: calculateScore(DEFAULT_FACTORS, DEFAULT_WEIGHTS)
          });
      }
    }),
    {
      name: 'neondash-health-engine', // Nome único para salvar no LocalStorage
      storage: createJSONStorage(() => localStorage),
      // Opcional: não persistir o estado de edição (isEditingWeights), apenas os dados
      partialize: (state) => ({ 
          factors: state.factors, 
          weights: state.weights, 
          globalScore: state.globalScore 
      }),
    }
  )
);