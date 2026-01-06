import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Agent, AgentStatus, AgentLog } from '../types';
import { useEventStore } from './useEventStore';
import { MOCK_AGENT_LOGS } from '../constants';

interface AgentState {
  agents: Agent[];
  logs: AgentLog[]; // Logs da sessão
  isLoading: boolean;
  
  fetchAgents: () => Promise<void>;
  addAgent: (agent: Agent) => Promise<void>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  
  // Novas ações de monitoramento
  recordUsage: (agentId: string, usage: { tokens: number, cost: number, latency: number, successful: boolean }) => Promise<void>;
  addLog: (log: AgentLog) => void;
  
  resetAgents: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  logs: [...MOCK_AGENT_LOGS], // Inicia com mock para não ficar vazio, novos entram no topo
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
            totalTokens: a.total_tokens || 0,
            cost: a.cost || 0,
            successRate: a.success_rate || 100, 
            avgLatency: a.avg_latency || 0,
            lastUsed: a.last_used ? new Date(a.last_used).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Nunca',
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

        useEventStore.getState().addEvent({
            level: 'info',
            title: 'Agente Criado',
            description: `Novo agente "${newAgent.name}" implantado com modelo ${newAgent.model}.`,
            source: 'AI Lab'
        });

        set((state) => ({ agents: [newAgent, ...state.agents] }));
    } catch (error) {
        console.error('Error adding agent:', error);
    }
  },
  
  updateAgent: async (id, changes) => {
    try {
        const state = get();
        const currentAgent = state.agents.find(a => a.id === id);

        const dbChanges: any = { ...changes };
        // Mapeamento de campos camelCase para snake_case do DB
        if (changes.systemPrompt !== undefined) dbChanges.system_prompt = changes.systemPrompt;
        if (changes.totalTokens !== undefined) dbChanges.total_tokens = changes.totalTokens;
        
        // Remove campos que não existem na tabela ou são computados
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

        if (currentAgent && changes.status && changes.status !== currentAgent.status) {
             useEventStore.getState().addEvent({
                level: changes.status === AgentStatus.MAINTENANCE ? 'warning' : 'info',
                title: 'Status de Agente',
                description: `Agente "${currentAgent.name}" agora está ${changes.status}.`,
                source: 'AI Ops'
            });
        }

        set((state) => ({
            agents: state.agents.map((a) => a.id === id ? { ...a, ...changes } : a)
        }));
    } catch (error) {
        console.error('Error updating agent:', error);
    }
  },
  
  deleteAgent: async (id) => {
    try {
        const state = get();
        const agent = state.agents.find(a => a.id === id);

        const { error } = await supabase.from('agents').delete().eq('id', id);
        if (error) throw error;

        if (agent) {
            useEventStore.getState().addEvent({
                level: 'warning',
                title: 'Agente Desativado',
                description: `O agente "${agent.name}" foi removido do cluster.`,
                source: 'AI Lab'
            });
        }

        set((state) => ({
            agents: state.agents.filter((a) => a.id !== id)
        }));
    } catch (error) {
        console.error('Error deleting agent:', error);
    }
  },

  // --- ACTIONS DE MONITORAMENTO REAL ---

  recordUsage: async (agentId, { tokens, cost, latency, successful }) => {
      try {
          const state = get();
          const agent = state.agents.find(a => a.id === agentId);
          if (!agent) return;

          // Cálculos acumulativos
          const newTotalTokens = (agent.totalTokens || 0) + tokens;
          const newTotalCost = (agent.cost || 0) + cost;
          
          // Média móvel simples para latência (peso 20% para novo valor para suavizar)
          const currentLatency = agent.avgLatency || latency;
          const newAvgLatency = Math.round((currentLatency * 0.8) + (latency * 0.2));

          // Atualiza Store local imediatamente (Optimistic UI)
          set((state) => ({
              agents: state.agents.map(a => a.id === agentId ? {
                  ...a,
                  totalTokens: newTotalTokens,
                  cost: newTotalCost,
                  avgLatency: newAvgLatency,
                  lastUsed: 'Agora'
              } : a)
          }));

          // Atualiza DB
          await supabase.from('agents').update({
              total_tokens: newTotalTokens,
              cost: newTotalCost,
              avg_latency: newAvgLatency,
              last_used: new Date().toISOString()
          }).eq('id', agentId);

      } catch (error) {
          console.error("Failed to record usage metrics:", error);
      }
  },

  addLog: (log) => {
      set((state) => ({
          logs: [log, ...state.logs].slice(0, 100) // Mantém últimos 100 logs
      }));
  },

  resetAgents: async () => {
    const state = get();
    await state.fetchAgents();
  },
}));