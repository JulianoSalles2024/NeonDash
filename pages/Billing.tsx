import React from 'react';
import Card from '../components/ui/Card';
import { TOKEN_USAGE_DATA, COLORS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CreditCard, Zap, Download } from 'lucide-react';

const Billing: React.FC = () => {
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
                    <h3 className="text-lg font-medium text-white mb-6">Consumo de Tokens (Mês Atual)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={TOKEN_USAGE_DATA} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                                <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} />
                                <YAxis stroke="#6b7280" tickFormatter={(value) => `${value/1000}k`} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#374151', color: '#fff' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {TOKEN_USAGE_DATA.map((entry, index) => (
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
                            <p className="text-2xl font-bold text-white mt-2">R$ 2.500<span className="text-sm font-normal text-gray-500">/mês</span></p>
                            <p className="text-xs text-gray-500 mt-1">Renova em 14 dias</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Estimativa de Custo</h3>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-sm text-gray-300">Base</span>
                            <span className="text-sm font-mono text-white">R$ 2.500,00</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-sm text-gray-300">Tokens Extras</span>
                            <span className="text-sm font-mono text-white">R$ 145,20</span>
                        </div>
                        <div className="flex justify-between items-center py-3 mt-2">
                            <span className="text-sm font-bold text-white">Total Estimado</span>
                            <span className="text-lg font-bold font-mono text-neon-green">R$ 2.645,20</span>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Zap size={16} className="text-yellow-400" />
                            <span>Você usou 78% da cota mensal.</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-yellow-400" style={{ width: '78%' }}></div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Billing;