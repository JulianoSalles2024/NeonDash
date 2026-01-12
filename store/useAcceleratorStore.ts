import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Mission } from '../types';

interface AcceleratorState {
  missions: Mission[];
  activeMissionId: string | null;
  
  setActiveMission: (id: string) => void;
  updateMissionTarget: (id: string, newTarget: number) => void;
  completeMission: (id: string) => void;
  resetMissions: () => void;
}

const DEFAULT_MISSIONS: Mission[] = [
    {
        id: 'm1',
        title: 'Missão 1: Base',
        description: 'Estabilidade, produto redondo e validação de canal.',
        target: 200,
        durationMonths: 3,
        status: 'active' // Começa ativa por padrão
    },
    {
        id: 'm2',
        title: 'Missão 2: Prova Social',
        description: 'Foco em parcerias e validação de modelo.',
        target: 500,
        durationMonths: 6,
        status: 'pending'
    },
    {
        id: 'm3',
        title: 'Missão 3: Escala Controlada',
        description: 'Crescimento com controle e manutenção da base.',
        target: 700,
        durationMonths: 9,
        status: 'pending'
    },
    {
        id: 'm4',
        title: 'Missão 4: Previsibilidade',
        description: 'Retenção, otimização e crescimento previsível.',
        target: 900,
        durationMonths: 12,
        status: 'pending'
    }
];

export const useAcceleratorStore = create<AcceleratorState>()(
    persist(
        (set, get) => ({
            missions: DEFAULT_MISSIONS,
            activeMissionId: 'm1',

            setActiveMission: (id) => set((state) => {
                const updatedMissions = state.missions.map(m => {
                    if (m.id === id) return { ...m, status: 'active' as const, startDate: new Date().toISOString() };
                    if (m.status === 'active') return { ...m, status: 'paused' as const };
                    return m;
                });
                return { missions: updatedMissions, activeMissionId: id };
            }),

            updateMissionTarget: (id, newTarget) => set((state) => ({
                missions: state.missions.map(m => m.id === id ? { ...m, target: newTarget } : m)
            })),

            completeMission: (id) => set((state) => ({
                missions: state.missions.map(m => m.id === id ? { ...m, status: 'completed' as const, completedAt: new Date().toISOString() } : m)
            })),

            resetMissions: () => set({ missions: DEFAULT_MISSIONS, activeMissionId: 'm1' })
        }),
        {
            name: 'neondash-accelerator',
            storage: createJSONStorage(() => localStorage)
        }
    )
);
