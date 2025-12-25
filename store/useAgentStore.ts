import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Agent, AgentStatus } from '../types';
import { MOCK_AGENTS } from '../constants';
import { supabase } from '../lib/supabase';

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

// Helper: Map DB snake_case to Frontend camelCase
const mapAgentFromDb = (dbAgent: any): Agent => ({
    id: dbAgent.id,
    name: dbAgent.name,
    description: dbAgent.description,
    status: dbAgent.status as AgentStatus,
    model: dbAgent.model,
    totalTokens: dbAgent.total_tokens || 0,
    avgLatency: dbAgent.avg_latency || 0,
    successRate: dbAgent.success_rate || 100,
    cost: dbAgent.cost || 0,
    lastUsed: dbAgent.last_used || 'Nunca',
    systemPrompt: dbAgent.system_prompt,
    temperature: dbAgent.temperature
});

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      isLoading: false,
      hasHydrated: false,

      fetchAgents: async () => {
          set({ isLoading: true });
          try {
              const { data, error } = await supabase
                  .from('agents')
                  .select('*')
                  .order('created_at', { ascending: false });

              if (error || !data || data.length === 0) {
                  // Fallback to local/mock if DB is empty or fails
                  const currentAgents = get().agents;
                  if (!get().hasHydrated && currentAgents.length === 0) {
                      set({ agents: MOCK_AGENTS, hasHydrated: true });
                  }
                  return;
              }

              set({ agents: data.map(mapAgentFromDb), hasHydrated: true });
          } catch (err) {
              console.error("Failed to fetch agents:", err);
          } finally {
              set({ isLoading: false });
          }
      },
      
      addAgent: async (agent) => {
        // Optimistic UI update
        const tempId = Date.now().toString();
        const optimisticAgent = { ...agent, id: tempId };
        set((state) => ({ agents: [optimisticAgent, ...state.agents] }));

        // DB Insert
        const dbPayload = {
            name: agent.name,
            description: agent.description,
            status: agent.status,
            model: agent.model,
            total_tokens: 0,
            avg_latency: 0,
            success_rate: 100,
            cost: 0,
            last_used: 'Agora',
            system_prompt: agent.systemPrompt,
            temperature: agent.temperature
        };

        const { data, error } = await supabase.from('agents').insert(dbPayload).select().single();

        if (!error && data) {
            // Replace temp ID with real UUID
            set((state) => ({
                agents: state.agents.map(a => a.id === tempId ? mapAgentFromDb(data) : a)
            }));
        }
      },
      
      updateAgent: async (id, changes) => {
        set((state) => ({
            agents: state.agents.map((a) => a.id === id ? { ...a, ...changes } : a)
        }));

        if (!isUUID(id)) return;

        const dbPayload: any = {};
        if (changes.name) dbPayload.name = changes.name;
        if (changes.description) dbPayload.description = changes.description;
        if (changes.status) dbPayload.status = changes.status;
        if (changes.model) dbPayload.model = changes.model;
        if (changes.systemPrompt) dbPayload.system_prompt = changes.systemPrompt;
        if (changes.temperature) dbPayload.temperature = changes.temperature;
        if (changes.totalTokens) dbPayload.total_tokens = changes.totalTokens;
        if (changes.cost) dbPayload.cost = changes.cost;
        if (changes.lastUsed) dbPayload.last_used = changes.lastUsed;

        await supabase.from('agents').update(dbPayload).eq('id', id);
      },
      
      deleteAgent: async (id) => {
        set((state) => ({
            agents: state.agents.filter((a) => a.id !== id)
        }));

        if (!isUUID(id)) return;
        await supabase.from('agents').delete().eq('id', id);
      },

      resetAgents: () => set({ agents: MOCK_AGENTS }),
    }),
    {
      name: 'neondash-agents-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);
