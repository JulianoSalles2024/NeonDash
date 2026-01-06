import React, { useState, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Calendar, Loader2 } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { COLORS } from '../../constants';
import Card from '../ui/Card';

const parseDateSafe = (dateInput: any): Date => {
    if (!dateInput) return new Date(0);
    // Se já for objeto Date
    if (dateInput instanceof Date) return dateInput;
    // Se não for string, retorna data zero
    if (typeof dateInput !== 'string') return new Date(0);
    
    const dateStr = dateInput;
    if (dateStr === 'Nunca') return new Date(0);
    if (dateStr === 'Agora') return new Date();
    
    // Tenta formato ISO
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) return isoDate;

    // Tenta formato PT-BR (DD/MM/YYYY)
    if (dateStr.includes('/')) {
        const parts = dateStr.split(' '); // Separa data de hora se houver
        const dateParts = parts[0].split('/');
        if (dateParts.length === 3) {
            const [day, month, year] = dateParts.map(Number);
            if (day && month && year) {
                return new Date(year, month - 1, day);
            }
        }
    }
    
    // Fallback: Retorna data atual para não quebrar o gráfico, mas idealmente seria tratado na origem
    return new Date();
};

interface RetentionEvolutionChartProps {
    onClick?: () => void;
    className?: string;
}

const RetentionEvolutionChart: React.FC<RetentionEvolutionChartProps> = ({ onClick, className }) => {
    const { users, isLoading } = useUserStore();
    const [evolutionPeriod, setEvolutionPeriod] = useState<'week' | 'month' | 'year'>('month');

    // Filtra apenas usuários reais (não teste)
    const validUsers = useMemo(() => users.filter(u => !u.isTest), [users]);

    const evolutionData = useMemo(() => {
        const now = new Date();
        const dataPoints: any[] = [];
        let iterations = 0;
        let dateFormat: (d: Date) => string;
        let stepDate: (d: Date, i: number) => Date;

        // Configuração dos intervalos baseada no período
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
            iterations = 30; 
            dateFormat = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            stepDate = (d, i) => {
                const newDate = new Date(d);
                newDate.setDate(d.getDate() - i);
                newDate.setHours(23, 59, 59, 999);
                return newDate;
            };
        } else {
            iterations = 12;
            dateFormat = (d) => d.toLocaleDateString('pt-BR', { month: 'short' });
            stepDate = (d, i) => {
                const newDate = new Date(d);
                newDate.setMonth(d.getMonth() - i);
                newDate.setMonth(newDate.getMonth() + 1); // Vai para o próximo mês
                newDate.setDate(0); // Volta para o último dia do mês atual da iteração
                newDate.setHours(23, 59, 59, 999);
                return newDate;
            };
        }

        // Gera os buckets de tempo (do mais antigo para o mais novo)
        const buckets = [];
        for (let i = iterations - 1; i >= 0; i--) {
            buckets.push({
                date: stepDate(now, i),
                label: '' 
            });
        }
        
        // Aplica labels
        buckets.forEach(b => b.label = dateFormat(b.date));

        // Popula os dados
        buckets.forEach(bucket => {
            const pointDate = bucket.date;
            let activeCount = 0;
            let churnCount = 0;

            validUsers.forEach(user => {
                const joinDate = parseDateSafe(user.joinedAt);
                
                // Se o usuário entrou antes ou na data do bucket
                if (joinDate <= pointDate) {
                    if (user.status === 'Cancelado') {
                        let churnDate = parseDateSafe(user.lastActive);
                        // Correção: Se churn data for inválida ou anterior à entrada, assume data de entrada
                        if (churnDate < joinDate) churnDate = joinDate;

                        // Se cancelou antes ou na data do bucket, conta como churn
                        if (churnDate <= pointDate) {
                            churnCount++;
                        } else {
                            // Se ainda não tinha cancelado nesta data, era ativo
                            activeCount++;
                        }
                    } else {
                        // Usuário não cancelado conta como ativo
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

        // Fallback visual se não houver buckets (tecnicamente impossível pelo loop acima, mas seguro)
        if (dataPoints.length === 0) {
            return [{ name: 'Sem dados', active: 0, churn: 0 }];
        }

        return dataPoints;

    }, [evolutionPeriod, validUsers]);

    return (
        <Card className={`flex flex-col ${className}`} onClick={onClick}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Calendar size={16} className="text-neon-cyan" /> Evolução da Base vs Churn
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Comparativo ao longo do tempo.</p>
                </div>
                
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 scale-90 origin-right" onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={() => setEvolutionPeriod('week')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${evolutionPeriod === 'week' ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Semana
                    </button>
                    <button 
                        onClick={() => setEvolutionPeriod('month')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${evolutionPeriod === 'month' ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Mês
                    </button>
                    <button 
                        onClick={() => setEvolutionPeriod('year')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${evolutionPeriod === 'year' ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Ano
                    </button>
                </div>
            </div>

            {/* Container do Gráfico com Altura Fixa REDUZIDA para evitar rolagem */}
            <div className="w-full h-[200px]">
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
                                tick={{fill: '#6b7280', fontSize: 10}} 
                                dy={10} 
                                interval={evolutionPeriod === 'month' ? 2 : 0}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#6b7280', fontSize: 10}} 
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
                                height={24} 
                                iconType="circle"
                                formatter={(value) => <span className="text-[10px] text-gray-400 ml-1">{value === 'active' ? 'Ativos' : 'Churn'}</span>}
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
    );
};

export default RetentionEvolutionChart;