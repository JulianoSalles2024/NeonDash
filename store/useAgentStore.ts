import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Agent, AgentStatus } from '../types';

interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  
  fetchAgents: () => Promise<void>;
  addAgent: (agent: Agent) => Promise<void>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  resetAgents: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  isLoading: false,

  fetchAgents: async () => {
      set({ isLoading: true });
      try {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedAgents: Agent[] = (data || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            model: a.model,
            status: a.status as AgentStatus,
            systemPrompt: a.system_prompt,
            temperature: a.temperature,
            totalTokens: a.total_tokens,
            cost: a.cost,
            successRate: 98.5, // Campo mockado ou calculado via logs no futuro
            avgLatency: 800,   // Campo mockado ou calculado via logs no futuro
            lastUsed: 'Hoje',
        }));

        set({ agents: formattedAgents });
      } catch (error) {
          console.error('Error fetching agents:', error);
      } finally {
          set({ isLoading: false });
      }
  },
  
  addAgent: async (agent) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .insert({
                name: agent.name,
                description: agent.description,
                model: agent.model,
                status: agent.status,
                system_prompt: agent.systemPrompt,
                temperature: agent.temperature,
                total_tokens: 0,
                cost: 0
            })
            .select()
            .single();

        if (error) throw error;

        const newAgent: Agent = {
            ...agent,
            id: data.id,
            totalTokens: 0,
            cost: 0
        };

        set((state) => ({ agents: [newAgent, ...state.agents] }));
    } catch (error) {
        console.error('Error adding agent:', error);
    }
  },
  
  updateAgent: async (id, changes) => {
    try {
        const dbChanges: any = { ...changes };
        if (changes.systemPrompt !== undefined) dbChanges.system_prompt = changes.systemPrompt;
        if (changes.totalTokens !== undefined) dbChanges.total_tokens = changes.totalTokens;
        
        // Remove campos frontend-only
        delete dbChanges.systemPrompt;
        delete dbChanges.totalTokens;
        delete dbChanges.lastUsed;
        delete dbChanges.avgLatency;
        delete dbChanges.successRate;
        delete dbChanges.versions;

        const { error } = await supabase
            .from('agents')
            .update(dbChanges)
            .eq('id', id);

        if (error) throw error;

        set((state) => ({
            agents: state.agents.map((a) => a.id === id ? { ...a, ...changes } : a)
        }));
    } catch (error) {
        console.error('Error updating agent:', error);
    }
  },
  
  deleteAgent: async (id) => {
    try {
        const { error } = await supabase.from('agents').delete().eq('id', id);
        if (error) throw error;
        set((state) => ({
            agents: state.agents.filter((a) => a.id !== id)
        }));
    } catch (error) {
        console.error('Error deleting agent:', error);
    }
  },

  resetAgents: async () => {
    const state = get();
    await state.fetchAgents();
  },
}));