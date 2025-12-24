
export enum UserStatus {
    ACTIVE = 'Ativo',
    RISK = 'Risco',
    CHURNED = 'Cancelado',
    NEW = 'Novo',
    GHOST = 'Fantasma'
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