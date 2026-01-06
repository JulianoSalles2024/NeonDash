import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import { COLORS } from '../constants';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Users, TrendingDown, Info, Calendar, Loader2 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

// Função auxiliar para parsing de datas (ISO ou PT-BR DD/MM/YYYY)
const parseDateSafe = (dateStr: string): Date => {
    if (!dateStr || dateStr === 'Nunca') return new Date(0); 
    if (dateStr === 'Agora') return new Date();
    
    // Tenta formato ISO (YYYY-MM-DD)
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime()) && dateStr.includes('-')) return isoDate;

    // Tenta formato PT-BR (DD/MM/YYYY)
    if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/').map(Number);
        if (day && month && year) {
            return new Date(year, month - 1, day);
        }
    }
    
    return new Date(); // Fallback
};

// Helper para calcular diferença em meses
const monthDiff = (d1: Date, d2: Date) => {
    let months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
};

const Retention: React.FC = () => {
    const { users, isLoading } = useUserStore();
    const [evolutionPeriod, setEvolutionPeriod] = useState<'week' | 'month' | 'year'>('year');

    // --- CÁLCULOS DINÂMICOS (EXCLUDING TEST USERS) ---
    const validUsers = useMemo(() => users.filter(u => !u.isTest), [users]);

    const totalUsers = validUsers.length;
    const churnedUsers = validUsers.filter(u => u.status === 'Cancelado').length;
    
    // Cálculo de Churn Rate
    const churnRate = totalUsers > 0 ? (churnedUsers / (totalUsers + churnedUsers)) * 100 : 0;

    // Cálculo Simples de NDR (Net Dollar Retention)
    const currentMRR = validUsers.reduce((acc, u) => acc + (u.status !== 'Cancelado' ? u.mrr : 0), 0);
    const potentialMRR = validUsers.reduce((acc, u) => acc + u.mrr, 0); 
    
    const ndr = potentialMRR > 0 ? (currentMRR / potentialMRR) * 100 : 0;

    // --- PROCESSAMENTO DE DADOS REAIS PARA O GRÁFICO ---
    const evolutionData = useMemo(() => {
        const now = new Date();
        const dataPoints: any[] = [];
        let iterations = 0;
        let dateFormat: (d: Date) => string;
        let stepDate: (d: Date, i: number) => Date;

        // 1. Definir janela de tempo e labels
        if (evolutionPeriod === 'week') {
            iterations = 7;
            dateFormat = (d) => d.toLocaleDateString('pt-BR', { weekday: 'short' });
            stepDate = (d, i) => {
                const newDate = new Date(d);
                newDate.setDate(d.getDate() - i);
                newDate.setHours(23, 59, 59, 999);
                return newDate;
            };
        } else if (evolutionPeriod === 'month') {
            iterations = 30; // Últimos 30 dias
            dateFormat = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            stepDate = (d, i) => {
                const newDate = new Date(d);
                newDate.setDate(d.getDate() - i);
                newDate.setHours(23, 59, 59, 999);
                return newDate;
            };
        } else {
            iterations = 12; // Últimos 12 meses
            dateFormat = (d) => d.toLocaleDateString('pt-BR', { month: 'short' });
            stepDate = (d, i) => {
                const newDate = new Date(d);
                newDate.setMonth(d.getMonth() - i);
                // Fim do mês para pegar todo acumulado
                newDate.setMonth(newDate.getMonth() + 1); 
                newDate.setDate(0);
                newDate.setHours(23, 59, 59, 999);
                return newDate;
            };
        }

        // 2. Construir Timeline (do passado para o presente)
        const buckets = [];
        for (let i = iterations - 1; i >= 0; i--) {
            buckets.push({
                date: stepDate(now, i),
                label: '' // Será preenchido
            });
        }
        
        buckets.forEach(b => b.label = dateFormat(b.date));

        // 3. Popular Buckets com dados Reais
        buckets.forEach(bucket => {
            const pointDate = bucket.date;
            let activeCount = 0;
            let churnCount = 0;

            validUsers.forEach(user => {
                const joinDate = parseDateSafe(user.joinedAt);
                
                // Usuário existe neste ponto da história?
                if (joinDate <= pointDate) {
                    // É Churn?
                    if (user.status === 'Cancelado') {
                        // Data estimada do churn
                        let churnDate = parseDateSafe(user.lastActive);
                        if (churnDate < joinDate) churnDate = joinDate;

                        if (churnDate <= pointDate) {
                            // Já tinha cancelado nesta data
                            churnCount++;
                        } else {
                            // Ainda estava ativo nesta data (cancelou no futuro)
                            activeCount++;
                        }
                    } else {
                        // É ativo hoje, então era ativo no passado (desde que entrou)
                        activeCount++;
                    }
                }
            });

            dataPoints.push({
                name: bucket.label,
                active: activeCount,
                churn: churnCount,
            });
        });

        if (dataPoints.length === 0) {
            return [{ name: 'Sem dados', active: 0, churn: 0 }];
        }

        return dataPoints;

    }, [evolutionPeriod, validUsers]);

    // --- DADOS COHORT REAL ---
    const cohortData = useMemo(() => {
        if (validUsers.length === 0) return [];

        const now = new Date();
        const cohorts: Record<string, { startSize: number, retained: number[], monthDate: Date }> = {};
        const monthsToTrack = 6; // Mostramos 6 meses de retenção

        // 1. Inicializar Cohorts (Agrupar por Mês de Entrada)
        validUsers.forEach(user => {
            const joinDate = parseDateSafe(user.joinedAt);
            const cohortKey = joinDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); // ex: Jan/24
            
            // Chave de ordenação (YYYY-MM)
            const sortKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;

            if (!cohorts[sortKey]) {
                cohorts[sortKey] = {
                    startSize: 0,
                    retained: Array(monthsToTrack).fill(0),
                    monthDate: new Date(joinDate.getFullYear(), joinDate.getMonth(), 1)
                };
            }

            // Incrementar tamanho inicial da coorte
            cohorts[sortKey].startSize++;

            // Calcular retenção para os meses subsequentes
            let churnDate: Date | null = null;
            if (user.status === 'Cancelado') {
                churnDate = parseDateSafe(user.lastActive);
                if (churnDate < joinDate) churnDate = joinDate;
            }

            // Verificar retenção para mês 0, 1, 2...
            for (let i = 0; i < monthsToTrack; i++) {
                // Data de corte para este mês da coorte
                const checkDate = new Date(cohorts[sortKey].monthDate);
                checkDate.setMonth(checkDate.getMonth() + i + 1); // Fim do mês seguinte
                checkDate.setDate(0); // Último dia do mês

                // Só calculamos se o mês já aconteceu (não prevemos futuro)
                if (checkDate <= now || (checkDate.getMonth() === now.getMonth() && checkDate.getFullYear() === now.getFullYear())) {
                    if (churnDate) {
                        // Se churnou DEPOIS da data de corte, estava retido
                        if (churnDate > checkDate) {
                            cohorts[sortKey].retained[i]++;
                        }
                    } else {
                        // Se não churnou, está retido
                        cohorts[sortKey].retained[i]++;
                    }
                } else {
                    // Mês futuro -> null para indicar que não existe dado ainda
                    cohorts[sortKey].retained[i] = -1; 
                }
            }
        });

        // 2. Formatar para Tabela
        // Pegar apenas as últimas 6 coortes e ordenar
        const sortedKeys = Object.keys(cohorts).sort().reverse().slice(0, 6);

        return sortedKeys.map(key => {
            const data = cohorts[key];
            const rates = data.retained.map(count => {
                if (count === -1) return null; // Futuro
                if (data.startSize === 0) return 0;
                return Math.round((count / data.startSize) * 100);
            });

            // Mês 0 sempre é 100% (por definição, ou quase)
            // Ajuste visual: se o array tiver dados, forçamos o índice 0 ser 100 se o usuário quiser a visão clássica
            // Mas a lógica acima (checkDate) calcula quem terminou o mês 0. Se churnou no dia 2, não conta.
            // Vamos manter a lógica estrita de "Retention at End of Month".

            return {
                month: data.monthDate.toLocaleDateString('pt-BR', { month: 'short' }),
                fullDate: key, // Para debug/sort
                size: data.startSize,
                rates: rates
            };
        });

    }, [validUsers]);

    // Pequeno gráfico de sparkline para o KPI topo
    const churnSparkData = evolutionData.map(d => ({ value: d.churn }));

    const getCellColor = (rate: number | null) => {
        if (rate === null) return 'bg-transparent';
        if (rate >= 90) return 'bg-neon-green/20 text-neon-green border border-neon-green/30';
        if (rate >= 75) return 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30';
        if (rate >= 50) return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
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
                         <p className="text-xs text-gray-400 uppercase mb-2">Tendência de Churn</p>
                         <div className="h-12 w-full flex items-end">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={churnSparkData}>
                                    <Area type="monotone" dataKey="value" stroke={COLORS.pink} fill={COLORS.pink} fillOpacity={0.1} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>

                {/* --- GRÁFICO DE EVOLUÇÃO (REAL) --- */}
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
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="animate-spin text-neon-cyan" size={32} />
                            </div>
                        ) : (
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
                                        interval={evolutionPeriod === 'month' ? 2 : 0}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#6b7280', fontSize: 12}} 
                                        allowDecimals={false}
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
                        )}
                    </div>
                </Card>

                {/* Cohort Analysis (REAL CALCULATION) */}
                <Card className="col-span-12">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-white">Análise de Cohort (Retenção Mensal)</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Porcentagem de usuários que permanecem ativos após X meses da entrada.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><div className="w-2 h-2 bg-neon-green/30 rounded-full"></div> &gt;90%</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><div className="w-2 h-2 bg-neon-blue/20 rounded-full"></div> 75-90%</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><div className="w-2 h-2 bg-red-500/20 rounded-full"></div> &lt;50%</span>
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
                                        <th className="p-3 text-left text-xs text-gray-500 uppercase font-medium bg-white/[0.02]">Coorte (Entrada)</th>
                                        <th className="p-3 text-xs text-gray-500 uppercase font-medium bg-white/[0.02]">Clientes</th>
                                        {[0, 1, 2, 3, 4, 5].map(m => (
                                            <th key={m} className="p-3 text-xs text-gray-500 uppercase font-medium">Mês {m}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {cohortData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-3 text-left text-sm font-bold text-white font-mono border-r border-white/5">
                                                {row.month}
                                            </td>
                                            <td className="p-3 text-sm text-gray-400 font-mono border-r border-white/5">
                                                {row.size}
                                            </td>
                                            {row.rates.map((rate, rIdx) => (
                                                <td key={rIdx} className="p-1">
                                                    {rate !== null ? (
                                                        <div className={`py-2 mx-1 rounded text-xs font-bold font-mono ${getCellColor(rate)}`}>
                                                            {rate}%
                                                        </div>
                                                    ) : (
                                                        <div className="py-2 text-xs text-gray-700">-</div>
                                                    )}
                                                </td>
                                            ))}
                                            {/* Fill empty cells if rates array is shorter than expected columns (rare) */}
                                            {Array.from({ length: 6 - row.rates.length }).map((_, i) => (
                                                <td key={`empty-${i}`} className="p-1"></td>
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