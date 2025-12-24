
import { User, UserStatus, AIInsight, ChartDataPoint, UserEvent } from './types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Alice Freeman',
    company: 'Nebula Corp',
    email: 'alice@nebula.io',
    avatar: 'https://picsum.photos/40/40?random=1',
    status: UserStatus.ACTIVE,
    healthScore: 92,
    metrics: { engagement: 95, support: 90, finance: 100, risk: 85 },
    lastActive: 'há 2 min',
    plan: 'Enterprise',
    tokensUsed: 45020,
    mrr: 2500
  },
  {
    id: '2',
    name: 'Marcus Chen',
    company: 'Quantum Systems',
    email: 'm.chen@quantum.sys',
    avatar: 'https://picsum.photos/40/40?random=2',
    status: UserStatus.RISK,
    healthScore: 45,
    metrics: { engagement: 30, support: 60, finance: 80, risk: 20 },
    lastActive: 'há 5 dias',
    plan: 'Pro',
    tokensUsed: 1200,
    mrr: 450
  },
  {
    id: '3',
    name: 'Sarah Connor',
    company: 'Skynet Inc',
    email: 'sarah@skynet.net',
    avatar: 'https://picsum.photos/40/40?random=3',
    status: UserStatus.ACTIVE,
    healthScore: 88,
    metrics: { engagement: 98, support: 85, finance: 90, risk: 80 },
    lastActive: 'Agora',
    plan: 'Enterprise',
    tokensUsed: 89000,
    mrr: 5000
  },
  {
    id: '4',
    name: 'John Doe',
    company: 'Acme Ltd',
    email: 'john@acme.com',
    avatar: 'https://picsum.photos/40/40?random=4',
    status: UserStatus.GHOST,
    healthScore: 22,
    metrics: { engagement: 10, support: 40, finance: 50, risk: 10 },
    lastActive: 'há 14 dias',
    plan: 'Starter',
    tokensUsed: 50,
    mrr: 99
  },
  {
    id: '5',
    name: 'Elena Gilbert',
    company: 'Mystic Falls',
    email: 'elena@mystic.com',
    avatar: 'https://picsum.photos/40/40?random=5',
    status: UserStatus.ACTIVE,
    healthScore: 78,
    metrics: { engagement: 75, support: 80, finance: 85, risk: 70 },
    lastActive: 'há 1 hora',
    plan: 'Pro',
    tokensUsed: 3400,
    mrr: 450
  },
  {
    id: '6',
    name: 'Robert Ford',
    company: 'Westworld Host',
    email: 'ford@delos.inc',
    avatar: 'https://picsum.photos/40/40?random=6',
    status: UserStatus.ACTIVE,
    healthScore: 95,
    metrics: { engagement: 99, support: 95, finance: 95, risk: 90 },
    lastActive: 'há 10 min',
    plan: 'Enterprise',
    tokensUsed: 120000,
    mrr: 3500
  },
  {
    id: '7',
    name: 'Diana Prince',
    company: 'Themyscira',
    email: 'diana@amazon.com',
    avatar: 'https://picsum.photos/40/40?random=7',
    status: UserStatus.NEW,
    healthScore: 100,
    metrics: { engagement: 100, support: 100, finance: 100, risk: 100 },
    lastActive: 'há 30 min',
    plan: 'Starter',
    tokensUsed: 10,
    mrr: 99
  },
  {
    id: '8',
    name: 'Bruce Wayne',
    company: 'Wayne Ent',
    email: 'bruce@wayne.com',
    avatar: 'https://picsum.photos/40/40?random=8',
    status: UserStatus.GHOST,
    healthScore: 15,
    metrics: { engagement: 5, support: 20, finance: 100, risk: 10 },
    lastActive: 'há 28 dias',
    plan: 'Enterprise',
    tokensUsed: 0,
    mrr: 2500
  },
  {
    id: '9',
    name: 'Tony Stark',
    company: 'Stark Ind',
    email: 'tony@stark.com',
    avatar: 'https://picsum.photos/40/40?random=9',
    status: UserStatus.ACTIVE,
    healthScore: 65,
    metrics: { engagement: 60, support: 50, finance: 100, risk: 60 },
    lastActive: 'há 3 horas',
    plan: 'Pro',
    tokensUsed: 4500,
    mrr: 450
  },
  {
    id: '10',
    name: 'Wanda Maximoff',
    company: 'Westview',
    email: 'wanda@hex.com',
    avatar: 'https://picsum.photos/40/40?random=10',
    status: UserStatus.RISK,
    healthScore: 38,
    metrics: { engagement: 40, support: 30, finance: 60, risk: 30 },
    lastActive: 'há 2 dias',
    plan: 'Starter',
    tokensUsed: 800,
    mrr: 99
  },
  {
    id: '11',
    name: 'Clark Kent',
    company: 'Daily Planet',
    email: 'ckent@planet.news',
    avatar: 'https://picsum.photos/40/40?random=11',
    status: UserStatus.ACTIVE,
    healthScore: 82,
    metrics: { engagement: 80, support: 85, finance: 80, risk: 85 },
    lastActive: 'há 45 min',
    plan: 'Pro',
    tokensUsed: 2100,
    mrr: 450
  },
  {
    id: '12',
    name: 'Peter Parker',
    company: 'Bugle',
    email: 'spidey@queens.ny',
    avatar: 'https://picsum.photos/40/40?random=12',
    status: UserStatus.CHURNED,
    healthScore: 0,
    metrics: { engagement: 10, support: 10, finance: 0, risk: 0 },
    lastActive: 'há 2 meses',
    plan: 'Starter',
    tokensUsed: 120,
    mrr: 0
  }
];

export const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: '1',
    type: 'alert',
    priority: 'high',
    message: 'Queda súbita no consumo de tokens da API no coorte Enterprise (-15% na última hora).',
    timestamp: 'há 10 min'
  },
  {
    id: '2',
    type: 'optimization',
    priority: 'medium',
    message: 'Usuário "Quantum Systems" mostra padrão similar a usuários cancelados. Ação sugerida: Enviar check-in.',
    timestamp: 'há 1 hora'
  },
  {
    id: '3',
    type: 'info',
    priority: 'low',
    message: 'Taxa de conversão da nova etapa do funil "Onboarding Completo" subiu 4%.',
    timestamp: 'há 2 horas'
  }
];

export const MOCK_USER_EVENTS: UserEvent[] = [
    {
        id: '1',
        type: 'info',
        title: 'Login Realizado',
        description: 'Usuário logou via Google OAuth (IP: 201.12.44.11)',
        timestamp: 'Hoje, 14:32'
    },
    {
        id: '2',
        type: 'success',
        title: 'Feature Usada: Relatório Avançado',
        description: 'Exportou relatório PDF com 45 páginas.',
        timestamp: 'Hoje, 14:35'
    },
    {
        id: '3',
        type: 'warning',
        title: 'Limite de API Próximo',
        description: 'Atingiu 80% da quota diária de requests.',
        timestamp: 'Hoje, 15:00'
    },
    {
        id: '4',
        type: 'error',
        title: 'Falha de Pagamento',
        description: 'Cartão final 4242 recusado (Saldo insuficiente).',
        timestamp: 'Ontem, 09:12'
    },
    {
        id: '5',
        type: 'info',
        title: 'Sessão Iniciada',
        description: 'Usuário iniciou sessão no dispositivo Mobile.',
        timestamp: 'Ontem, 08:30'
    }
];

export const MOCK_CRITICAL_STREAM = [
  {
      id: 'c1',
      level: 'critical',
      title: 'Risco de Churn: Usuário Enterprise',
      description: 'A conta "Nebula Corp" reduziu o uso em 60% nas últimas 48h e visitou a página de cancelamento.',
      timestamp: 'há 2 min',
      source: 'Prediction Engine',
      action: 'Contatar CS'
  },
  {
      id: 'c2',
      level: 'warning',
      title: 'Latência Elevada na API de Relatórios',
      description: 'Tempo médio de resposta subiu de 200ms para 1.5s no cluster us-east-1.',
      timestamp: 'há 14 min',
      source: 'Infrastructure',
      action: 'Ver Logs'
  },
  {
      id: 'c3',
      level: 'critical',
      title: 'Falha em Webhooks de Pagamento',
      description: '35 notificações de falha recebidas do Stripe. Sincronização de planos pode estar atrasada.',
      timestamp: 'há 28 min',
      source: 'Billing System',
      action: 'Retry Queue'
  },
  {
      id: 'c4',
      level: 'warning',
      title: 'Tentativa de Acesso Suspeito',
      description: 'Múltiplos logins falhados (IP: 45.22.11.00) na conta admin principal.',
      timestamp: 'há 45 min',
      source: 'Security',
      action: 'Bloquear IP'
  },
  {
    id: 'c5',
    level: 'info',
    title: 'Uso da Nova Feature "Relatórios" +400%',
    description: 'Adoção massiva após email marketing. Monitorar carga.',
    timestamp: 'há 1h',
    source: 'Analytics',
    action: 'Ver Dashboard'
  }
];

export const ARR_DATA: ChartDataPoint[] = [
  { name: '00:00', value: 120 },
  { name: '04:00', value: 122 },
  { name: '08:00', value: 118 },
  { name: '12:00', value: 128 },
  { name: '16:00', value: 135 },
  { name: '20:00', value: 142 },
  { name: '24:00', value: 140 },
];

export const CHURN_DATA: ChartDataPoint[] = [
  { name: 'Seg', value: 1.2 },
  { name: 'Ter', value: 1.1 },
  { name: 'Qua', value: 1.4 },
  { name: 'Qui', value: 0.9 },
  { name: 'Sex', value: 0.8 },
  { name: 'Sab', value: 0.7 },
  { name: 'Dom', value: 0.6 },
];

export const FUNNEL_DATA: ChartDataPoint[] = [
    { name: 'Cadastro', value: 4000 },
    { name: 'Ativado', value: 3000 },
    { name: '1º Valor', value: 2000 },
    { name: 'Pago', value: 1500 },
    { name: 'Retido', value: 1200 },
];

export const YEARLY_TREND_DATA: ChartDataPoint[] = [
  { name: 'JAN', value: 45, value2: 30 },
  { name: 'FEV', value: 52, value2: 35 },
  { name: 'MAR', value: 48, value2: 55 },
  { name: 'ABR', value: 61, value2: 45 },
  { name: 'MAI', value: 55, value2: 60 },
  { name: 'JUN', value: 67, value2: 58 },
  { name: 'JUL', value: 62, value2: 70 },
  { name: 'AGO', value: 75, value2: 65 },
  { name: 'SET', value: 60, value2: 55 },
  { name: 'OUT', value: 68, value2: 48 },
  { name: 'NOV', value: 72, value2: 60 },
  { name: 'DEZ', value: 80, value2: 75 },
];

export const TOKEN_USAGE_DATA: ChartDataPoint[] = [
    { name: 'Sem 1', value: 120000 },
    { name: 'Sem 2', value: 132000 },
    { name: 'Sem 3', value: 101000 },
    { name: 'Sem 4', value: 145000 },
];

// Dados simulados para Cohort (Month vs Retention Month %)
export const COHORT_DATA = [
    { month: 'Jun', rates: [100, 94, 88, 85, 82, 80] },
    { month: 'Jul', rates: [100, 92, 86, 83, 81] },
    { month: 'Ago', rates: [100, 95, 89, 87] },
    { month: 'Set', rates: [100, 91, 85] },
    { month: 'Out', rates: [100, 96] },
    { month: 'Nov', rates: [100] },
];

export const COLORS = {
  cyan: '#7CFCF3',
  blue: '#4EE1FF',
  purple: '#9B5CFF',
  pink: '#FF4ECF',
  green: '#34FFB0',
  grid: '#1f2937', // gray-800
};