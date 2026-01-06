import React, { useMemo } from 'react';
import Card from '../components/ui/Card';
import { COLORS } from '../constants';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Users, TrendingDown, Info, Calendar, Loader2 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import RetentionEvolutionChart from '../components/Charts/RetentionEvolutionChart';

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

const Retention: React.FC = () => {
    const { users, isLoading } = useUserStore();

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

    // --- DADOS COHORT REAL ---
    const cohortData = useMemo(() => {
        if (validUsers.length === 0) return [];

        const now = new Date();
        const cohorts: Record<string, { startSize: number, retained: number[], monthDate: Date }> = {};
        const monthsToTrack = 6; // Mostramos 6 meses de retenção

        // 1. Inicializar Cohorts (Agrupar por Mês de Entrada)
        validUsers.forEach(user => {
            const joinDate = parseDateSafe(user.joinedAt);
            
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

            return {
                month: data.monthDate.toLocaleDateString('pt-BR', { month: 'short' }),
                fullDate: key,
                size: data.startSize,
                rates: rates
            };
        });

    }, [validUsers]);

    // Pequeno gráfico de sparkline para o KPI topo (usando dados simplificados)
    const churnSparkData = useMemo(() => {
        // Gera dados simples baseados no churn rate
        return Array.from({length: 10}, (_, i) => ({ value: churnRate + (Math.random() - 0.5) }));
    }, [churnRate]);

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

                {/* --- GRÁFICO DE EVOLUÇÃO (REUSABLE COMPONENT) --- */}
                <div className="col-span-12">
                    <RetentionEvolutionChart />
                </div>

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