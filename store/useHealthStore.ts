import { create } from 'zustand';

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

export const useHealthStore = create<HealthState>((set, get) => ({
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
}));