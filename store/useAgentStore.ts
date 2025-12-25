import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Agent } from '../types';
import { MOCK_AGENTS } from '../constants';

interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  hasHydrated: boolean;
  
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

      fetchAgents: async () => {
          const currentAgents = get().agents;
          if (currentAgents.length === 0) {
              set({ agents: MOCK_AGENTS, hasHydrated: true });
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

      resetAgents: () => set({ agents: MOCK_AGENTS }),
    }),
    {
      name: 'neondash-agents-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);