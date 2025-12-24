import React from 'react';
import Card from '../components/ui/Card';
import { COHORT_DATA, CHURN_DATA, COLORS } from '../constants';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Users, TrendingDown } from 'lucide-react';

const Retention: React.FC = () => {
    // Helper to color cohort cells
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
                            <p className="text-2xl font-bold text-white">108%</p>
                        </div>
                    </Card>
                    <Card className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-lg text-neon-pink"><TrendingDown size={24} /></div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Churn Involuntário</p>
                            <p className="text-2xl font-bold text-white">0.4%</p>
                        </div>
                    </Card>
                    <Card className="flex flex-col justify-between h-full">
                         <p className="text-xs text-gray-400 uppercase mb-2">Tendência de Churn (7d)</p>
                         <div className="h-12 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={CHURN_DATA}>
                                    <Area type="monotone" dataKey="value" stroke={COLORS.pink} fill={COLORS.pink} fillOpacity={0.1} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                         </div>
                    </Card>
                </div>

                {/* Cohort Analysis */}
                <Card className="col-span-12">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-white">Análise de Cohort (Retenção Mensal)</h3>
                        <div className="flex gap-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><div className="w-2 h-2 bg-neon-green/30 rounded-full"></div> >95%</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><div className="w-2 h-2 bg-neon-green/10 rounded-full"></div> 85-95%</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500/10 rounded-full"></div> 70-85%</span>
                        </div>
                    </div>
                    
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
                                {COHORT_DATA.map((row, idx) => (
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
                </Card>
            </div>
        </div>
    );
};

export default Retention;