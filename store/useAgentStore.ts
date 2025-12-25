import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Agent } from '../types';
import { MOCK_AGENTS } from '../constants';

interface AgentState {
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, data: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  resetAgents: () => void;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      agents: MOCK_AGENTS,
      
      addAgent: (agent) => set((state) => ({ 
        agents: [agent, ...state.agents] 
      })),
      
      updateAgent: (id, data) => set((state) => ({
        agents: state.agents.map((a) => a.id === id ? { ...a, ...data } : a)
      })),
      
      deleteAgent: (id) => set((state) => ({
        agents: state.agents.filter((a) => a.id !== id)
      })),

      resetAgents: () => set({ agents: MOCK_AGENTS }),
    }),
    {
      name: 'neondash-agents-storage', 
    }
  )
);
