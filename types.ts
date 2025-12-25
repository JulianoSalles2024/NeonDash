export enum UserStatus {
    ACTIVE = 'Ativo',
    RISK = 'Risco',
    CHURNED = 'Cancelado',
    NEW = 'Novo',
    GHOST = 'Fantasma'
  }

  export enum AgentStatus {
    ONLINE = 'Online',
    MAINTENANCE = 'Manutenção',
    OFFLINE = 'Offline',
    TRAINING = 'Treinando'
  }
  
  export interface MetricTrend {
    value: number;
    label: string; // e.g., "vs last 24h"
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  }
  
  export interface UserHealthMetrics {
    engagement: number; // 0-100
    support: number;    // 0-100 (High is good health)
    finance: number;    // 0-100 (High is good health)
    risk: number;       // 0-100 (High is safe, Low is risky)
  }
  
  export interface User {
    id: string;
    name: string;
    company: string;
    email: string;
    avatar: string;
    status: UserStatus;
    healthScore: number;
    metrics: UserHealthMetrics; // New detailed metrics
    lastActive: string;
    plan: 'Starter' | 'Pro' | 'Enterprise'; 
    tokensUsed: number;
    mrr: number;
  }

  export interface AgentVersion {
    version: string;
    createdAt: string;
    model: string;
    changeLog: string;
    status: 'active' | 'archived';
  }

  export interface Agent {
    id: string;
    name: string;
    description: string;
    status: AgentStatus;
    model: string; // e.g. GPT-4o, Claude 3.5
    totalTokens: number;
    avgLatency: number; // in ms
    successRate: number; // percentage
    cost: number; // estimated cost
    lastUsed: string;
    versions?: AgentVersion[]; // Optional history
    systemPrompt?: string; // The "Brain" instructions
    temperature?: number; // Creativity (0-1)
  }

  export interface AgentLog {
    id: string;
    agentId: string;
    timestamp: string;
    input: string;
    output: string;
    tokens: number;
    latency: number;
    cost: number;
    status: 'success' | 'error' | 'timeout';
    model: string;
  }
  
  export interface AIInsight {
    id: string;
    type: 'alert' | 'optimization' | 'info';
    message: string;
    timestamp: string;
    priority: 'high' | 'medium' | 'low';
  }
  
  export interface ChartDataPoint {
    name: string;
    value: number;
    value2?: number;
  }

  export interface UserEvent {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    description: string;
    timestamp: string;
    icon?: string;
  }

  export interface StreamEvent {
    id: string;
    level: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    description: string;
    timestamp: string;
    source: string;
    action?: string;
  }