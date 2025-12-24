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

    return labels.map(label => ({
        name: label,
        value: Math.floor(baseValue + (Math.random() - 0.5) * volatility)
    }));
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

export const fetchDashboardMetrics = async (timeframe: string): Promise<DashboardMetricsResponse> => {
    // Simulate network latency (300-800ms)
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    // Determine base values based on timeframe to simulate different views
    // e.g., '1h' might show lower aggregated numbers if we were aggregating, 
    // but for "Active Users Now" it stays similar, just the chart flickers.
    
    // Randomize slightly so it feels "live" on every fetch
    const noise = () => (Math.random() - 0.5) * 0.1; 

    return {
        activeUsers: {
            current: Math.floor(124 * (1 + noise())), // Adjusted to ~124 users
            trend: 4.2 + Math.floor(noise() * 20) / 10,
            history: generateMockData(timeframe, 120, 15)
        },
        mrr: {
            current: 18450 + Math.floor(noise() * 500), // Adjusted to ~R$ 18.5k
            trend: 2.8 + noise() * 2,
            history: generateMockData(timeframe, 18200, 300)
        },
        churn: {
            current: Math.abs(1.2 + noise()), // Slightly more realistic churn fluctuation
            trend: -0.1 + noise(),
            history: generateMockData(timeframe, 1.2, 0.3).map(p => ({...p, value: Math.abs(p.value)}))
        },
        healthScore: Math.min(100, Math.max(0, Math.floor(87 + noise() * 5)))
    };
};