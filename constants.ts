import { User, UserStatus, AIInsight, ChartDataPoint, UserEvent, Agent, AgentStatus, AgentLog, StreamEvent } from './types';

// --- MODEL PRICING REGISTRY (USD per 1M tokens) ---
// Prices are estimated/current as of late 2024/early 2025
export const MODEL_REGISTRY: Record<string, { provider: string, inputPrice: number, outputPrice: number, label: string }> = {
    // OPENAI
    'gpt-4o': { provider: 'OpenAI', inputPrice: 2.50, outputPrice: 10.00, label: 'GPT-4o' },
    'gpt-4o-mini': { provider: 'OpenAI', inputPrice: 0.15, outputPrice: 0.60, label: 'GPT-4o Mini' },
    'o1-preview': { provider: 'OpenAI', inputPrice: 15.00, outputPrice: 60.00, label: 'o1 Preview (Thinking)' },
    'o1-mini': { provider: 'OpenAI', inputPrice: 3.00, outputPrice: 12.00, label: 'o1 Mini' },
    'gpt-3.5-turbo': { provider: 'OpenAI', inputPrice: 0.50, outputPrice: 1.50, label: 'GPT-3.5 Turbo' },

    // ANTHROPIC
    'claude-3-5-sonnet': { provider: 'Anthropic', inputPrice: 3.00, outputPrice: 15.00, label: 'Claude 3.5 Sonnet' },
    'claude-3-opus': { provider: 'Anthropic', inputPrice: 15.00, outputPrice: 75.00, label: 'Claude 3 Opus' },
    'claude-3-haiku': { provider: 'Anthropic', inputPrice: 0.25, outputPrice: 1.25, label: 'Claude 3 Haiku' },

    // GOOGLE
    'gemini-3-pro-preview': { provider: 'Google', inputPrice: 1.25, outputPrice: 5.00, label: 'Gemini 3 Pro' },
    'gemini-3-flash-preview': { provider: 'Google', inputPrice: 0.075, outputPrice: 0.30, label: 'Gemini 3 Flash' },
    'gemini-1.0-pro': { provider: 'Google', inputPrice: 0.50, outputPrice: 1.50, label: 'Gemini 1.0 Pro' },

    // OTHERS / SPECIALIZED
    'mistral-large': { provider: 'Mistral', inputPrice: 2.00, outputPrice: 6.00, label: 'Mistral Large 2' },
    'manus-1': { provider: 'Manus', inputPrice: 5.00, outputPrice: 15.00, label: 'Manus Agentic v1' }, // Estimativa
    'llama-3.1-405b': { provider: 'Meta (Hosted)', inputPrice: 3.00, outputPrice: 3.00, label: 'Llama 3.1 405B' },
};

// MOCK USERS REMOVIDOS - LISTA VAZIA
export const MOCK_USERS: User[] = [];

export const MOCK_AGENTS: Agent[] = [
    {
        id: '1',
        name: 'Método',
        description: 'Define a estratégia e estrutura lógica',
        status: AgentStatus.ONLINE,
        model: 'gpt-4o',
        totalTokens: 1250000,
        avgLatency: 850,
        successRate: 99.2,
        cost: 12.50,
        lastUsed: 'há 2 min',
        temperature: 0.3,
        systemPrompt: "Você é um estrategista de negócios experiente. Seu foco é analisar o problema do usuário e definir uma estrutura lógica passo-a-passo para a solução. Seja metódico, direto e evite jargões desnecessários."
    },
    {
        id: '2',
        name: 'Persona',
        description: 'Criação e simulação de avatares',
        status: AgentStatus.ONLINE,
        model: 'claude-3-5-sonnet',
        totalTokens: 980000,
        avgLatency: 1200,
        successRate: 98.5,
        cost: 14.70,
        lastUsed: 'há 15 min',
        temperature: 0.8,
        systemPrompt: "Você é um especialista em psicologia do consumidor. Sua tarefa é criar perfis de personas detalhados, incluindo dores, desejos, objeções e linguagem típica. Quando solicitado, simule uma conversa como se fosse a persona."
    },
    {
        id: '3',
        name: 'Oferta',
        description: 'Estruturação de promessas e entregáveis',
        status: AgentStatus.ONLINE,
        model: 'gpt-4o',
        totalTokens: 850000,
        avgLatency: 920,
        successRate: 97.8,
        cost: 8.50,
        lastUsed: 'há 1 hora',
        temperature: 0.5,
        systemPrompt: "Você é um copywriter focado em ofertas irresistíveis. Ajude a estruturar a Promessa Única de Valor (UVP), os entregáveis (stack), os bônus e a garantia. Foque em alto valor percebido."
    },
    {
        id: '4',
        name: 'Funil',
        description: 'Arquitetura de conversão e etapas',
        status: AgentStatus.MAINTENANCE,
        model: 'gpt-3.5-turbo',
        totalTokens: 2100000,
        avgLatency: 450,
        successRate: 94.1,
        cost: 4.20,
        lastUsed: 'há 3 horas',
        temperature: 0.2,
        systemPrompt: "Você é um arquiteto de funis de vendas. Desenhe jornadas do cliente desde o tráfego frio até a conversão. Sugira upsells, downsells e order bumps lógicos."
    },
    {
        id: '5',
        name: 'Planejador de conteúdo',
        description: 'Calendário editorial e pautas',
        status: AgentStatus.ONLINE,
        model: 'claude-3-haiku',
        totalTokens: 1500000,
        avgLatency: 600,
        successRate: 99.5,
        cost: 2.25,
        lastUsed: 'há 5 min',
        temperature: 0.6,
        systemPrompt: "Você é um gerente de mídia social. Crie calendários editoriais que misturam conteúdo educacional, de entretenimento e de vendas. Mantenha a consistência da voz da marca."
    },
    {
        id: '6',
        name: 'Gerador de conteúdo',
        description: 'Escrita de posts, blogs e scripts',
        status: AgentStatus.ONLINE,
        model: 'gemini-3-pro-preview',
        totalTokens: 4500000,
        avgLatency: 2100,
        successRate: 96.0,
        cost: 28.00,
        lastUsed: 'Agora',
        temperature: 0.7,
        systemPrompt: "Você é um redator criativo e versátil. Escreva textos engajadores para blogs, legendas de Instagram e roteiros de YouTube. Adapte o tom de voz conforme solicitado."
    },
    {
        id: '7',
        name: 'Ganchos',
        description: 'Criação de headlines de alta conversão',
        status: AgentStatus.ONLINE,
        model: 'gpt-4o-mini',
        totalTokens: 320000,
        avgLatency: 500,
        successRate: 98.9,
        cost: 3.20,
        lastUsed: 'há 45 min',
        temperature: 0.9,
        systemPrompt: "Você é um especialista em atenção. Sua única função é criar 'Hooks' (ganchos) e Headlines impossíveis de ignorar. Use curiosidade, polêmica, promessa ou identificação."
    },
    {
        id: '8',
        name: 'Copy ADS',
        description: 'Textos persuasivos para tráfego pago',
        status: AgentStatus.ONLINE,
        model: 'claude-3-5-sonnet',
        totalTokens: 670000,
        avgLatency: 1100,
        successRate: 97.5,
        cost: 10.05,
        lastUsed: 'há 2 horas',
        temperature: 0.6,
        systemPrompt: "Você é um especialista em anúncios pagos (Meta Ads, Google Ads). Escreva copies curtas e diretas focadas em CTR (Click-Through Rate). Siga frameworks como AIDA ou PAS."
    },
    {
        id: '9',
        name: 'Conteúdos virais',
        description: 'Análise de tendências e adaptação',
        status: AgentStatus.TRAINING,
        model: 'manus-1',
        totalTokens: 2500000,
        avgLatency: 3500,
        successRate: 88.0,
        cost: 25.00,
        lastUsed: 'há 1 dia',
        temperature: 1.0,
        systemPrompt: "Você é um analista de tendências digitais. Identifique padrões em vídeos virais e sugira adaptações para o nicho do usuário. Pense fora da caixa."
    },
    {
        id: '10',
        name: 'Closer Digital',
        description: 'Script de vendas e quebra de objeções',
        status: AgentStatus.ONLINE,
        model: 'mistral-large',
        totalTokens: 1100000,
        avgLatency: 950,
        successRate: 95.5,
        cost: 11.00,
        lastUsed: 'há 10 min',
        temperature: 0.4,
        systemPrompt: "Você é um vendedor experiente. Seu objetivo é fechar vendas. Forneça scripts para lidar com objeções comuns como 'está caro', 'vou pensar' ou 'preciso falar com meu sócio'."
    }
];

export const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: '1',
    type: 'alert',
    priority: 'high',
    message: 'Sistema inicializado sem dados. Aguardando novos registros.',
    timestamp: 'agora'
  }
];

export const MOCK_USER_EVENTS: UserEvent[] = [];

export const MOCK_CRITICAL_STREAM: StreamEvent[] = [
  {
      id: 'c1',
      level: 'info',
      title: 'Sistema Iniciado',
      description: 'Plataforma carregada com sucesso. Base de usuários vazia.',
      timestamp: 'agora',
      source: 'System',
      action: 'Check'
  }
];

export const MOCK_AGENT_LOGS: AgentLog[] = [
    {
        id: 'log-1',
        agentId: '1',
        timestamp: '14:32:05',
        input: 'Crie um título viral para um post sobre IA no LinkedIn.',
        output: '🚀 "A IA não vai te substituir, mas quem usa IA vai." Descubra como...',
        tokens: 450,
        latency: 820,
        cost: 0.04,
        status: 'success',
        model: 'GPT-4o'
    }
];

export const ARR_DATA: ChartDataPoint[] = [];

export const CHURN_DATA: ChartDataPoint[] = [];

export const FUNNEL_DATA: ChartDataPoint[] = [
    { name: 'Cadastro', value: 0 },
    { name: 'Ativado', value: 0 },
    { name: '1º Valor', value: 0 },
    { name: 'Pago', value: 0 },
    { name: 'Retido', value: 0 },
];

export const YEARLY_TREND_DATA: ChartDataPoint[] = [];

export const TOKEN_USAGE_DATA: ChartDataPoint[] = [
    { name: 'Sem 1', value: 0 },
    { name: 'Sem 2', value: 0 },
    { name: 'Sem 3', value: 0 },
    { name: 'Sem 4', value: 0 },
];

export const COHORT_DATA = [];

export const COLORS = {
  cyan: '#7CFCF3',
  blue: '#4EE1FF',
  purple: '#9B5CFF',
  pink: '#FF4ECF',
  green: '#34FFB0',
  grid: '#1f2937', // gray-800
};