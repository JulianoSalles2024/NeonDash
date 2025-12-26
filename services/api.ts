import { ChartDataPoint } from '../types';

// Helper to generate random data based on timeframe
const generateMockData = (timeframe: string, baseValue: number, volatility: number): ChartDataPoint[] => {
    let points = 7;
    let labels: string[] = [];

    switch(timeframe) {
        case '1h':
            points = 12; // Every 5 mins
            labels = Array.from({length: 12}, (_, i) => `${i * 5}m`);
            break;
        case '24h':
            points = 8; // Every 3 hours
            labels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
            break;
        case '7d':
            points = 7;
            labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
            break;
        case '30d':
            points = 15; // Every 2 days roughly
            labels = Array.from({length: 15}, (_, i) => `D${i * 2 + 1}`);
            break;
    }

    // Se o valor base for 0, retorna um gráfico plano zerado
    if (baseValue === 0) {
        return labels.map(label => ({ name: label, value: 0 }));
    }

    return labels.map(label => {
        // Garante que não gere números negativos para usuários/dinheiro
        const randomVariation = (Math.random() - 0.5) * volatility;
        const value = Math.max(0, Math.floor(baseValue + randomVariation));
        return {
            name: label,
            value: value
        };
    });
};

// Simulation of a backend response
export interface DashboardMetricsResponse {
    activeUsers: {
        current: number;
        trend: number;
        history: ChartDataPoint[];
    };
    mrr: {
        current: number;
        trend: number;
        history: ChartDataPoint[];
    };
    churn: {
        current: number;
        trend: number;
        history: ChartDataPoint[];
    };
    healthScore: number;
}

// Agora aceita o estado atual real para gerar histórico coerente
export const fetchDashboardMetrics = async (
    timeframe: string, 
    currentStats: { users: number, mrr: number, churn: number, health: number }
): Promise<DashboardMetricsResponse> => {
    
    // Simulate network latency (300-800ms)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Se não houver usuários, zera todas as tendências
    if (currentStats.users === 0) {
        return {
            activeUsers: { current: 0, trend: 0, history: generateMockData(timeframe, 0, 0) },
            mrr: { current: 0, trend: 0, history: generateMockData(timeframe, 0, 0) },
            churn: { current: 0, trend: 0, history: generateMockData(timeframe, 0, 0) },
            healthScore: 0
        };
    }

    // Se houver dados, gera uma "flutuação" baseada nos dados reais para parecer vivo
    const noise = () => (Math.random() - 0.5) * 0.1; 

    return {
        activeUsers: {
            current: currentStats.users,
            trend: Number((noise() * 5).toFixed(2)), // Pequena variação simulada
            history: generateMockData(timeframe, currentStats.users, currentStats.users * 0.1)
        },
        mrr: {
            current: currentStats.mrr,
            trend: Number((noise() * 2).toFixed(2)),
            history: generateMockData(timeframe, currentStats.mrr, currentStats.mrr * 0.05)
        },
        churn: {
            current: currentStats.churn,
            trend: Number((noise()).toFixed(2)),
            history: generateMockData(timeframe, currentStats.churn, 0.5)
        },
        healthScore: currentStats.health
    };
};