import React, { useState, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Calendar, Loader2 } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { COLORS } from '../../constants';
import Card from '../ui/Card';

const parseDateSafe = (dateStr: string): Date => {
    if (!dateStr || dateStr === 'Nunca') return new Date(0);
    if (dateStr === 'Agora') return new Date();
    
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime()) && dateStr.includes('-')) return isoDate;

    if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/').map(Number);
        if (day && month && year) {
            return new Date(year, month - 1, day);
        }
    }
    
    return new Date();
};

interface RetentionEvolutionChartProps {
    onClick?: () => void;
    className?: string;
}

const RetentionEvolutionChart: React.FC<RetentionEvolutionChartProps> = ({ onClick, className }) => {
    const { users, isLoading } = useUserStore();
    const [evolutionPeriod, setEvolutionPeriod] = useState<'week' | 'month' | 'year'>('month');

    const validUsers = useMemo(() => users.filter(u => !u.isTest), [users]);

    const evolutionData = useMemo(() => {
        const now = new Date();
        const dataPoints: any[] = [];
        let iterations = 0;
        let dateFormat: (d: Date) => string;
        let stepDate: (d: Date, i: number) => Date;

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
                newDate.setMonth(newDate.getMonth() + 1);
                newDate.setDate(0);
                newDate.setHours(23, 59, 59, 999);
                return newDate;
            };
        }

        const buckets = [];
        for (let i = iterations - 1; i >= 0; i--) {
            buckets.push({
                date: stepDate(now, i),
                label: '' 
            });
        }
        
        buckets.forEach(b => b.label = dateFormat(b.date));

        buckets.forEach(bucket => {
            const pointDate = bucket.date;
            let activeCount = 0;
            let churnCount = 0;

            validUsers.forEach(user => {
                const joinDate = parseDateSafe(user.joinedAt);
                
                if (joinDate <= pointDate) {
                    if (user.status === 'Cancelado') {
                        let churnDate = parseDateSafe(user.lastActive);
                        if (churnDate < joinDate) churnDate = joinDate;

                        if (churnDate <= pointDate) {
                            churnCount++;
                        } else {
                            activeCount++;
                        }
                    } else {
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

    return (
        <Card className={`min-h-[400px] flex flex-col ${className}`} onClick={onClick}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Calendar size={18} className="text-neon-cyan" /> Evolução da Base vs Churn
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Comparativo de usuários ativos e cancelamentos ao longo do tempo.</p>
                </div>
                
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10" onClick={(e) => e.stopPropagation()}>
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

            <div className="flex-1 w-full min-h-[300px]">
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
    );
};

export default RetentionEvolutionChart;