import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import { COLORS } from '../constants';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Users, TrendingDown, Info, Calendar } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

const Retention: React.FC = () => {
    const { users } = useUserStore();
    const [evolutionPeriod, setEvolutionPeriod] = useState<'week' | 'month' | 'year'>('year');

    // --- CÁLCULOS DINÂMICOS (EXCLUDING TEST USERS) ---
    const validUsers = users.filter(u => !u.isTest);

    const totalUsers = validUsers.length;
    const churnedUsers = validUsers.filter(u => u.status === 'Cancelado').length;
    
    // Cálculo de Churn Rate
    const churnRate = totalUsers > 0 ? (churnedUsers / (totalUsers + churnedUsers)) * 100 : 0;

    // Cálculo Simples de NDR (Net Dollar Retention)
    const currentMRR = validUsers.reduce((acc, u) => acc + (u.status !== 'Cancelado' ? u.mrr : 0), 0);
    const potentialMRR = validUsers.reduce((acc, u) => acc + u.mrr, 0); 
    
    const ndr = potentialMRR > 0 ? (currentMRR / potentialMRR) * 100 : 0;

    // --- GERADOR DE DADOS DE EVOLUÇÃO ---
    const evolutionData = useMemo(() => {
        const baseActive = totalUsers > 0 ? totalUsers : 100; // Fallback para visualização se vazio
        const baseChurn = churnedUsers > 0 ? churnedUsers : 5;

        // Funções auxiliares de randomização controlada
        const noise = (val: number) => Math.floor(val + (Math.random() * val * 0.2 - val * 0.1));
        
        if (evolutionPeriod === 'week') {
            return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((day, i) => ({
                name: day,
                active: noise(baseActive + (i * 2)), // Crescimento leve
                churn: Math.max(0, noise(baseChurn / 4))
            }));
        } else if (evolutionPeriod === 'month') {
            return Array.from({ length: 15 }, (_, i) => ({
                name: `Dia ${i * 2 + 1}`,
                active: noise(baseActive * 0.8 + (i * baseActive * 0.02)),
                churn: Math.max(0, noise(baseChurn / 2))
            }));
        } else {
            // Year
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return months.map((month, i) => ({
                name: month,
                active: noise(baseActive * 0.4 + (i * baseActive * 0.08)), // Crescimento anual simulado
                churn: Math.max(0, noise(baseChurn + (i * 0.5)))
            }));
        }
    }, [evolutionPeriod, totalUsers, churnedUsers]);

    // --- DADOS COHORT (MOCK VISUAL) ---
    const cohortData = useMemo(() => {
        if (totalUsers === 0) return [];
        const base = 100 - churnRate;
        return [
            { month: 'Jan', rates: [100, base - 1, base - 2, base - 2.5, base - 3, base - 3.2].map(n => Math.max(0, Math.round(n))) },
            { month: 'Fev', rates: [100, base - 0.5, base - 1.5, base - 2.0, base - 2.8].map(n => Math.max(0, Math.round(n))) },
            { month: 'Mar', rates: [100, base - 1.2, base - 2.2, base - 3.0].map(n => Math.max(0, Math.round(n))) },
            { month: 'Abr', rates: [100, base - 0.8, base - 1.5].map(n => Math.max(0, Math.round(n))) },
            { month: 'Mai', rates: [100, base - 0.5].map(n => Math.max(0, Math.round(n))) },
            { month: 'Jun', rates: [100].map(n => Math.max(0, Math.round(n))) },
        ];
    }, [totalUsers, churnRate]);

    // Pequeno gráfico de sparkline para o KPI topo
    const churnSparkData = [
        { value: churnRate }, { value: churnRate + 0.2 }, { value: churnRate - 0.1 }, 
        { value: churnRate + 0.5 }, { value: churnRate + 0.1 }, { value: churnRate }
    ];

    const getCellColor = (rate: number) => {
        if (rate >= 95) return 'bg-neon-green/30 text-white';
        if (rate >= 85) return 'bg-neon-green/10 text-gray-200';
        if (rate >= 70) return 'bg-yellow-500/10 text-yellow-500';
        return 'bg-red-500/10 text-red-500';
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-20">
            <h1 className="text-3xl font-bold font-display text-white mb-8">Retenção e Churn</h1>

            <div className="grid grid-cols-12 gap-6">
                {/* KPIs Top */}
                <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-lg text-neon-purple"><Users size={24} /></div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Retenção Líquida (NDR)</p>
                            <p className="text-2xl font-bold text-white">{ndr.toFixed(0)}%</p>
                        </div>
                    </Card>
                    <Card className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-lg text-neon-pink"><TrendingDown size={24} /></div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Churn Involuntário</p>
                            <p className="text-2xl font-bold text-white">{churnRate.toFixed(1)}%</p>
                        </div>
                    </Card>
                    <Card className="flex flex-col justify-between h-full min-h-[120px]">
                         <p className="text-xs text-gray-400 uppercase mb-2">Tendência de Churn (7d)</p>
                         <div className="h-12 w-full flex items-end">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={churnSparkData}>
                                    <Area type="monotone" dataKey="value" stroke={COLORS.pink} fill={COLORS.pink} fillOpacity={0.1} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>

                {/* --- GRÁFICO DE EVOLUÇÃO (NOVO) --- */}
                <Card className="col-span-12 min-h-[450px]">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <Calendar size={18} className="text-neon-cyan" /> Evolução da Base vs Churn
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Comparativo de usuários ativos e cancelamentos ao longo do tempo.</p>
                        </div>
                        
                        {/* Seletor de Período */}
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                            <button 
                                onClick={() => setEvolutionPeriod('week')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${evolutionPeriod === 'week' ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Semana
                            </button>
                            <button 
                                onClick={() => setEvolutionPeriod('month')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${evolutionPeriod === 'month' ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Mês
                            </button>
                            <button 
                                onClick={() => setEvolutionPeriod('year')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${evolutionPeriod === 'year' ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Ano
                            </button>
                        </div>
                    </div>

                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLORS.green} stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.pink} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLORS.pink} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#6b7280', fontSize: 12}} 
                                    dy={10} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#6b7280', fontSize: 12}} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(value: number, name: string) => [
                                        value, 
                                        name === 'active' ? 'Usuários Ativos' : 'Churn (Cancelados)'
                                    ]}
                                    labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    height={36} 
                                    iconType="circle"
                                    formatter={(value) => <span className="text-xs text-gray-400 ml-1">{value === 'active' ? 'Ativos' : 'Churn'}</span>}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="active" 
                                    name="active"
                                    stroke={COLORS.green} 
                                    strokeWidth={2}
                                    fill="url(#colorActive)" 
                                    animationDuration={1000}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="churn" 
                                    name="churn"
                                    stroke={COLORS.pink} 
                                    strokeWidth={2}
                                    fill="url(#colorChurn)" 
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Cohort Analysis */}
                <Card className="col-span-12">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-white">Análise de Cohort (Retenção Mensal)</h3>
                        <div className="flex gap-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><div className="w-2 h-2 bg-neon-green/30 rounded-full"></div> &gt;95%</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><div className="w-2 h-2 bg-neon-green/10 rounded-full"></div> 85-95%</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500/10 rounded-full"></div> 70-85%</span>
                        </div>
                    </div>
                    
                    {totalUsers === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-500 bg-white/[0.02] rounded-lg border border-white/5 border-dashed">
                            <Info size={32} className="mb-3 opacity-50" />
                            <p>Adicione usuários reais para visualizar a análise de coorte.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-3 text-left text-xs text-gray-500 uppercase font-medium">Mês</th>
                                        {[0, 1, 2, 3, 4, 5].map(m => (
                                            <th key={m} className="p-3 text-xs text-gray-500 uppercase font-medium">Mês {m}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {cohortData.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="p-3 text-left text-sm font-medium text-white bg-white/[0.02]">{row.month}</td>
                                            {row.rates.map((rate, rIdx) => (
                                                <td key={rIdx} className="p-1">
                                                    <div className={`py-2 rounded text-sm font-mono ${getCellColor(rate)}`}>
                                                        {rate}%
                                                    </div>
                                                </td>
                                            ))}
                                            {/* Fill empty cells */}
                                            {Array.from({ length: 6 - row.rates.length }).map((_, i) => (
                                                <td key={`empty-${i}`} className="p-1 bg-transparent"></td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Retention;