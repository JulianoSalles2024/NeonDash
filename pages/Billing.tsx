import React, { useMemo } from 'react';
import Card from '../components/ui/Card';
import { COLORS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CreditCard, Zap, Download, Info } from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';

const Billing: React.FC = () => {
    const { agents } = useAgentStore();

    // CONFIGURAÇÃO DO PLANO
    const basePlanCost = 2500; // Valor fixo do plano Enterprise
    const QUOTA = 10000000; // Cota de 10 Milhões de tokens

    // Cálculos Reais baseados na Store de Agentes
    const totalTokens = agents.reduce((acc, a) => acc + a.totalTokens, 0);
    const totalAgentCost = agents.reduce((acc, a) => acc + a.cost, 0);
    const totalEstimated = basePlanCost + totalAgentCost;
    
    const usagePercentage = Math.min(100, Math.round((totalTokens / QUOTA) * 100));

    // Gera dados do gráfico dinamicamente baseado no total de tokens dos agentes
    const dynamicChartData = useMemo(() => {
        // Se não houver tokens, mostra zerado
        if (totalTokens === 0) {
            return [
                { name: 'Sem 1', value: 0 }, { name: 'Sem 2', value: 0 },
                { name: 'Sem 3', value: 0 }, { name: 'Sem 4', value: 0 }
            ];
        }

        // Distribui o total de tokens simulando um consumo crescente ao longo do mês
        // Isso cria um gráfico visualmente coerente com o valor total
        return [
            { name: 'Sem 1', value: Math.floor(totalTokens * 0.15) }, // 15%
            { name: 'Sem 2', value: Math.floor(totalTokens * 0.22) }, // 22%
            { name: 'Sem 3', value: Math.floor(totalTokens * 0.35) }, // 35%
            { name: 'Sem 4', value: Math.floor(totalTokens * 0.28) }, // 28%
        ];
    }, [totalTokens]);

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-display text-white">Créditos e Fatura</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">
                    <Download size={16} /> Fatura Atual (PDF)
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Usage Chart */}
                <Card className="col-span-12 lg:col-span-8 min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-white">Consumo de Tokens (Mês Atual)</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                            <Info size={12} />
                            <span>Dados baseados nos {agents.length} agentes ativos</span>
                        </div>
                    </div>
                    
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dynamicChartData} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                                <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} />
                                <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#374151', color: '#fff' }}
                                    formatter={(value: number) => [`${value.toLocaleString()} tokens`, 'Consumo']}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {dynamicChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS.purple} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Plan Details */}
                <Card className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Plano Atual</h3>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
                            <div className="flex justify-between items-start mb-2">
                                <span className="px-2 py-1 bg-neon-cyan/10 text-neon-cyan text-xs font-bold rounded border border-neon-cyan/20">ENTERPRISE</span>
                                <CreditCard className="text-gray-400" size={20} />
                            </div>
                            <p className="text-2xl font-bold text-white mt-2">R$ {basePlanCost.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mês</span></p>
                            <p className="text-xs text-gray-500 mt-1">Renova em 14 dias</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Estimativa de Custo</h3>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-sm text-gray-300">Plano Base</span>
                            <span className="text-sm font-mono text-white">R$ {basePlanCost.toLocaleString()},00</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-sm text-gray-300">Consumo Agentes ({agents.length})</span>
                            <span className="text-sm font-mono text-white">R$ {totalAgentCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 mt-2">
                            <span className="text-sm font-bold text-white">Total Estimado</span>
                            <span className="text-lg font-bold font-mono text-neon-green">R$ {totalEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Zap size={16} className={`text-${usagePercentage > 80 ? 'red-500' : 'yellow-400'}`} />
                            <span>Você usou {usagePercentage}% da cota mensal.</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full ${usagePercentage > 80 ? 'bg-red-500' : 'bg-yellow-400'}`} style={{ width: `${usagePercentage}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 text-right">{(totalTokens/1000).toFixed(1)}k / {(QUOTA/1000000).toFixed(0)}M tokens</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Billing;