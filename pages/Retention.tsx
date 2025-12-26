import React, { useMemo } from 'react';
import Card from '../components/ui/Card';
import { COLORS } from '../constants';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, TrendingDown, Info } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

const Retention: React.FC = () => {
    const { users } = useUserStore();

    // --- CÁLCULOS DINÂMICOS ---
    const totalUsers = users.length;
    const churnedUsers = users.filter(u => u.status === 'Cancelado').length;
    
    // Cálculo de Churn Rate
    const churnRate = totalUsers > 0 ? (churnedUsers / (totalUsers + churnedUsers)) * 100 : 0;

    // Cálculo Simples de NDR (Net Dollar Retention)
    // NDR = (Receita Inicial + Expansão - Contração - Churn) / Receita Inicial
    // Aqui faremos uma aproximação baseada na saúde da base ativa vs total
    const currentMRR = users.reduce((acc, u) => acc + (u.status !== 'Cancelado' ? u.mrr : 0), 0);
    // Simulamos que a receita "esperada" seria se todos pagassem, para ter uma base
    const potentialMRR = users.reduce((acc, u) => acc + u.mrr, 0); 
    
    const ndr = potentialMRR > 0 ? (currentMRR / potentialMRR) * 100 : 0;

    // --- GERADORES DE DADOS VISUAIS ---
    // Só gera gráficos se houver usuários, senão retorna array vazio
    const churnChartData = useMemo(() => {
        if (totalUsers === 0) return [];
        return [
            { name: 'Seg', value: Math.max(0, churnRate + (Math.random() * 0.5 - 0.25)) },
            { name: 'Ter', value: Math.max(0, churnRate + (Math.random() * 0.5 - 0.25)) },
            { name: 'Qua', value: Math.max(0, churnRate + (Math.random() * 0.5 - 0.25)) },
            { name: 'Qui', value: Math.max(0, churnRate + (Math.random() * 0.5 - 0.25)) },
            { name: 'Sex', value: Math.max(0, churnRate + (Math.random() * 0.5 - 0.25)) },
            { name: 'Sab', value: Math.max(0, churnRate + (Math.random() * 0.5 - 0.25)) },
            { name: 'Dom', value: churnRate }
        ];
    }, [totalUsers, churnRate]);

    // Gera dados de Cohort fictícios baseados no NDR atual, apenas para visualização
    const cohortData = useMemo(() => {
        if (totalUsers === 0) return [];
        
        // Base rates decays slightly over months based on churn
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


    const getCellColor = (rate: number) => {
        if (rate >= 95) return 'bg-neon-green/30 text-white';
        if (rate >= 85) return 'bg-neon-green/10 text-gray-200';
        if (rate >= 70) return 'bg-yellow-500/10 text-yellow-500';
        return 'bg-red-500/10 text-red-500';
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
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
                            {totalUsers > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={churnChartData}>
                                        <Area type="monotone" dataKey="value" stroke={COLORS.pink} fill={COLORS.pink} fillOpacity={0.1} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full text-center text-xs text-gray-600 pb-2">Sem dados suficientes</div>
                            )}
                         </div>
                    </Card>
                </div>

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
                            <p>Adicione usuários para visualizar a análise de coorte.</p>
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