import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, UserHealthMetrics, UserStatus, UserEvent, SuccessJourney, JourneyStep } from '../types';
import { HealthWeights } from './useHealthStore';
import { useEventStore } from './useEventStore';

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  fetchUsers: () => Promise<void>;
  addUser: (user: Partial<User>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  recalculateAllScores: (weights: HealthWeights) => void;
  resetUsers: () => void;
}

const ensureMetrics = (metrics: any, baseScore: number): UserHealthMetrics => {
  if (metrics && typeof metrics === 'object') return metrics as UserHealthMetrics;
  
  return {
    engagement: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
    support: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
    finance: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
    risk: Math.min(100, Math.max(0, baseScore + (Math.random() * 20 - 10))),
  };
};

// Helper for deterministic pseudo-random based on string
const pseudoRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
};

// CONSTANTE COM OS TEXTOS DEFINITIVOS
const JOURNEY_TEMPLATE: JourneyStep[] = [
    { id: '1', label: 'Ativação', description: 'O cliente entende a plataforma e consegue usá-la sem fricção.', isCompleted: false, isAutomated: true },
    { id: '2', label: 'Estruturação do Método', description: 'O método foi corretamente implementado e está pronto para execução.', isCompleted: false, isAutomated: true },
    { id: '3', label: 'Execução Assistida', description: 'Agentes estão sendo usados para criar narrativas, conteúdos e ativos com apoio do sistema.', isCompleted: false, isAutomated: false },
    { id: '4', label: 'Valor Gerado', description: 'O cliente obteve um ganho real (tempo, dinheiro, performance ou clareza).', isCompleted: false, isAutomated: false },
    { id: '5', label: 'Escala (upsell)', description: 'Contratação de novos agentes ou planos.', isCompleted: false, isAutomated: false },
];

// Mock Journey Generator (Initial State - Deterministic)
const generateMockJourney = (status: UserStatus, userId: string = 'default'): SuccessJourney => {
    // Clona o template
    const steps = JSON.parse(JSON.stringify(JOURNEY_TEMPLATE));

    // Lógica Determinística para popular o Dashboard
    // 25% Success, 35% Advanced, 40% Mid
    const rand = Math.abs(pseudoRandom(userId));

    if (status === UserStatus.ACTIVE) {
        if (rand < 0.25) {
            // 25% - Resultado Atingido (Tudo completo)
            steps.forEach((s: any) => { s.isCompleted = true; s.completedAt = '2023-10-15'; });
        } else if (rand < 0.60) {
            // 35% - Valor Gerado (Até passo 4)
            steps[0].isCompleted = true; steps[1].isCompleted = true; steps[2].isCompleted = true; steps[3].isCompleted = true;
        } else {
            // 40% - Execução (Até passo 3)
            steps[0].isCompleted = true; steps[1].isCompleted = true; steps[2].isCompleted = true;
        }
    } else if (status === UserStatus.RISK) {
        // Risco geralmente travado no começo
        steps[0].isCompleted = true;
        steps[1].isCompleted = false;
    } else if (status === UserStatus.NEW) {
        // Novo pode ter completado o primeiro passo ou nada
        if (rand > 0.5) steps[0].isCompleted = true;
    } else if (status === UserStatus.CHURNED) {
        // Churn varia
        if (rand > 0.5) {
             steps[0].isCompleted = true; steps[1].isCompleted = true;
        }
    }

    const completedCount = steps.filter((s: any) => s.isCompleted).length;
    const journeyStatus = completedCount === 0 ? 'not_started' : completedCount === 5 ? 'achieved' : 'in_progress';

    return {
        coreGoal: 'Automatizar 80% do Suporte L1',
        status: journeyStatus,
        steps: steps,
        lastUpdate: new Date().toISOString()
    };
};

// Função que mescla o estado salvo no banco (checkboxes) com os novos textos (labels)
const mergeJourneyData = (savedJourney: SuccessJourney | undefined, userId: string, userStatus: UserStatus): SuccessJourney => {
    // Se não tem jornada salva, gera uma nova baseada no status
    if (!savedJourney) {
        return generateMockJourney(userStatus, userId);
    }

    // Se tem jornada salva, atualizamos os textos mas mantemos o status de concluído
    const updatedSteps = JOURNEY_TEMPLATE.map(templateStep => {
        // Tenta achar o passo correspondente salvo (pelo ID)
        const savedStep = savedJourney.steps.find(s => s.id === templateStep.id);
        
        return {
            ...templateStep, // Usa Label e Descrição novos
            isCompleted: savedStep ? savedStep.isCompleted : templateStep.isCompleted, // Mantém status salvo
            completedAt: savedStep ? savedStep.completedAt : undefined
        };
    });

    // Recalcula o status geral baseado nos passos mesclados
    const completedCount = updatedSteps.filter(s => s.isCompleted).length;
    const journeyStatus = completedCount === 0 ? 'not_started' : completedCount === 5 ? 'achieved' : 'in_progress';

    return {
        ...savedJourney,
        steps: updatedSteps,
        status: journeyStatus // Garante que o status global esteja sincronizado
    };
};

// Helper para gerar eventos baseados nas mudanças
const generateEventFromChanges = (changes: Partial<User>, currentUser: User): UserEvent | null => {
    const now = new Date().toLocaleString('pt-BR');
    const id = Date.now().toString();

    if (changes.lastActive && changes.lastActive !== currentUser.lastActive) {
        let dateDisplay = changes.lastActive;
        try {
            if (changes.lastActive.includes('-')) {
                const d = new Date(changes.lastActive);
                dateDisplay = d.toLocaleDateString() + ' às ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        } catch (e) {}

        // Dispara evento global
        useEventStore.getState().addEvent({
            level: 'info',
            title: 'Atividade de Usuário',
            description: `${currentUser.name} registrou acesso em ${dateDisplay}.`,
            source: 'Activity',
        });

        return {
            id,
            type: 'info',
            title: 'Acesso Registrado',
            description: `Última atividade atualizada manualmente para ${dateDisplay}.`,
            timestamp: now
        };
    }

    if (changes.status && changes.status !== currentUser.status) {
        const type = changes.status === UserStatus.CHURNED ? 'error' : 
                     changes.status === UserStatus.ACTIVE ? 'success' : 'warning';
        
        // Dispara evento global
        useEventStore.getState().addEvent({
            level: changes.status === UserStatus.CHURNED ? 'critical' : changes.status === UserStatus.RISK ? 'warning' : 'success',
            title: `Mudança de Status: ${changes.status}`,
            description: `${currentUser.name} mudou de ${currentUser.status} para ${changes.status}.`,
            source: 'CRM',
            action: changes.status === UserStatus.RISK ? 'Verificar' : undefined
        });

        return {
            id,
            type,
            title: 'Alteração de Status',
            description: `Status do usuário alterado de "${currentUser.status}" para "${changes.status}".`,
            timestamp: now
        };
    }

    if (changes.plan && changes.plan !== currentUser.plan) {
        useEventStore.getState().addEvent({
            level: 'success',
            title: 'Upgrade/Downgrade',
            description: `${currentUser.name} alterou o plano para ${changes.plan}.`,
            source: 'Billing',
            action: 'Fatura'
        });

        return {
            id,
            type: 'success',
            title: 'Mudança de Plano',
            description: `Plano atualizado para ${changes.plan}.`,
            timestamp: now
        };
    }

    return null;
};

export const useUserStore = create<UserState>((set, get) => ({
  users: [], 
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers: User[] = (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        company: u.company,
        phone: u.phone, // Mapeado
        status: u.status as UserStatus,
        plan: u.plan,
        mrr: u.mrr,
        healthScore: u.health_score,
        lastActive: u.last_active || 'Nunca',
        joinedAt: u.created_at,
        metrics: u.metrics,
        avatar: `https://ui-avatars.com/api/?name=${u.name}&background=random`,
        tokensUsed: 0,
        isTest: u.is_test || false,
        churnReason: u.metrics?.churnReason || '',
        history: u.metrics?.history || [],
        // FORÇA A ATUALIZAÇÃO DOS TEXTOS DA JORNADA, mantendo o status salvo
        journey: mergeJourneyData(u.metrics?.journey, u.id, u.status as UserStatus)
      }));

      set({ users: formattedUsers });
    } catch (err: any) {
      set({ error: err.message });
      console.error('Error fetching users:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addUser: async (userData) => {
    try {
      const baseMetrics = userData.metrics || ensureMetrics(null, userData.healthScore || 100);
      
      const initialHistory: UserEvent[] = [{
          id: Date.now().toString(),
          type: 'success',
          title: 'Usuário Criado',
          description: 'Cadastro realizado no sistema.',
          timestamp: new Date().toLocaleString('pt-BR')
      }];

      // Mock journey for initial creation (New user usually starts fresh)
      const mockJourney = generateMockJourney(userData.status || UserStatus.NEW, Date.now().toString());

      const metricsWithData = {
          ...baseMetrics,
          churnReason: userData.churnReason,
          history: initialHistory,
          // Persist journey in metrics jsonb column
          journey: mockJourney
      };

      const safeCreatedAt = userData.joinedAt && userData.joinedAt.length === 10
          ? `${userData.joinedAt}T12:00:00Z`
          : (userData.joinedAt || new Date().toISOString());

      const payload = {
          name: userData.name,
          email: userData.email,
          company: userData.company,
          phone: userData.phone, // Inclui telefone
          status: userData.status,
          plan: userData.plan,
          mrr: userData.mrr,
          health_score: userData.healthScore || 100,
          metrics: metricsWithData,
          last_active: new Date().toISOString(),
          created_at: safeCreatedAt,
          is_test: !!userData.isTest
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      const newUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        company: data.company,
        phone: data.phone,
        status: data.status as UserStatus,
        plan: data.plan,
        mrr: data.mrr,
        healthScore: data.health_score,
        lastActive: 'Agora',
        joinedAt: data.created_at,
        metrics: data.metrics,
        avatar: `https://ui-avatars.com/api/?name=${data.name}&background=random`,
        tokensUsed: 0,
        isTest: data.is_test,
        churnReason: data.metrics?.churnReason,
        history: data.metrics?.history,
        journey: data.metrics?.journey
      };

      // Dispara evento global
      useEventStore.getState().addEvent({
          level: 'success',
          title: 'Novo Cliente',
          description: `${newUser.name} (${newUser.company}) entrou na plataforma.`,
          source: 'Growth',
          action: 'Onboarding'
      });

      set((state) => ({ users: [newUser, ...state.users] }));
    } catch (err) {
      console.error('Error adding user:', err);
      throw err;
    }
  },

  updateUser: async (id, changes) => {
    try {
      const state = get();
      const currentUser = state.users.find(u => u.id === id);
      if (!currentUser) return;

      const newEvent = generateEventFromChanges(changes, currentUser);
      
      let updatedHistory = currentUser.history || [];
      if (newEvent) {
          updatedHistory = [newEvent, ...updatedHistory];
      }

      const dbPayload: any = {};

      if (changes.name !== undefined) dbPayload.name = changes.name;
      if (changes.company !== undefined) dbPayload.company = changes.company;
      if (changes.phone !== undefined) dbPayload.phone = changes.phone; // Atualiza telefone
      if (changes.email !== undefined) dbPayload.email = changes.email;
      if (changes.status !== undefined) dbPayload.status = changes.status;
      if (changes.plan !== undefined) dbPayload.plan = changes.plan;
      if (changes.mrr !== undefined) dbPayload.mrr = changes.mrr;
      if (changes.healthScore !== undefined) dbPayload.health_score = changes.healthScore;
      if (changes.isTest !== undefined) dbPayload.is_test = changes.isTest;
      if (changes.lastActive !== undefined) dbPayload.last_active = changes.lastActive;

      const currentMetrics = currentUser.metrics || ensureMetrics(null, 100);
      let newMetricsBase = { ...currentMetrics };
      
      // LOGIC: Boost Engagement on Activity
      if (changes.lastActive) {
          // If the user logs in/is active, boost engagement score
          newMetricsBase.engagement = Math.min(100, (newMetricsBase.engagement || 50) + 5);
      }
      
      // Override with manual changes if present
      if (changes.metrics) {
          newMetricsBase = { ...newMetricsBase, ...changes.metrics };
      }
          
      let finalChurnReason = changes.churnReason;
      if (changes.status && changes.status !== UserStatus.CHURNED) {
          finalChurnReason = '';
      } else if (finalChurnReason === undefined) {
          finalChurnReason = currentUser.churnReason;
      }

      // Determine the journey to persist.
      const finalJourney = changes.journey || currentUser.journey;

      dbPayload.metrics = {
          ...newMetricsBase,
          churnReason: finalChurnReason,
          history: updatedHistory,
          journey: finalJourney
      };
      
      if (changes.joinedAt) {
          if (changes.joinedAt.length === 10) {
              dbPayload.created_at = `${changes.joinedAt}T12:00:00Z`;
          } else {
              dbPayload.created_at = changes.joinedAt;
          }
      }

      const { error } = await supabase
        .from('clients')
        .update(dbPayload)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        users: state.users.map((u) => u.id === id ? { 
            ...u, 
            ...changes,
            // Ensure we update the local state metric immediately for UI feedback
            metrics: newMetricsBase, 
            history: updatedHistory,
            journey: changes.journey || u.journey
        } : u)
      }));
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  },

  deleteUser: async (id) => {
    try {
      const state = get();
      const user = state.users.find(u => u.id === id);
      
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;

      if (user) {
          useEventStore.getState().addEvent({
              level: 'warning',
              title: 'Usuário Excluído',
              description: `O registro de ${user.name} foi removido permanentemente.`,
              source: 'System'
          });
      }

      set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  },

  resetUsers: async () => {
    const state = get();
    await state.fetchUsers();
  },

  recalculateAllScores: (weights: HealthWeights) => set((state) => {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    
    const updatedUsers = state.users.map(user => {
        const metrics = ensureMetrics(user.metrics, user.healthScore);
        
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
            metrics: metrics,
            healthScore: Math.round(calculatedScore)
        };
    });

    return { users: updatedUsers };
  })
}));