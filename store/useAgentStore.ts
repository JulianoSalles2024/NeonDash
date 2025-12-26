import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Agent } from '../types';
import { MOCK_AGENTS } from '../constants';

interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  hasHydrated: boolean;
  isInitialized: boolean; // Flag de controle
  
  fetchAgents: () => Promise<void>;
  addAgent: (agent: Agent) => Promise<void>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  resetAgents: () => void;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      isLoading: false,
      hasHydrated: false,
      isInitialized: false,

      fetchAgents: async () => {
          const state = get();
          
          if (!state.isInitialized) {
              set({ agents: MOCK_AGENTS, isInitialized: true, hasHydrated: true });
          } else {
              set({ hasHydrated: true });
          }
      },
      
      addAgent: async (agent) => {
        const tempId = Date.now().toString();
        const newAgent = { ...agent, id: tempId };
        set((state) => ({ agents: [newAgent, ...state.agents] }));
      },
      
      updateAgent: async (id, changes) => {
        set((state) => ({
            agents: state.agents.map((a) => a.id === id ? { ...a, ...changes } : a)
        }));
      },
      
      deleteAgent: async (id) => {
        set((state) => ({
            agents: state.agents.filter((a) => a.id !== id)
        }));
      },

      resetAgents: () => set({ agents: MOCK_AGENTS, isInitialized: true }),
    }),
    {
      name: 'neondash-agents-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);