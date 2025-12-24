import React from 'react';
import Card from '../components/ui/Card';
import { FUNNEL_DATA, COLORS } from '../constants';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

const Funnel: React.FC = () => {
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
        <h1 className="text-3xl font-bold font-display text-white mb-6">Funil de Ativação</h1>
        
        <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12 lg:col-span-8 min-h-[400px]">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-medium text-white">Fluxo de Conversão (Últimos 30d)</h3>
                    <div className="flex gap-2">
                         <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400 border border-white/10">Todo Tráfego</span>
                         <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400 border border-white/10">Mobile</span>
                    </div>
                </div>

                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={FUNNEL_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} />
                            <YAxis stroke="#6b7280" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#374151', color: '#fff' }}
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            />
                            <Bar dataKey="value">
                                {FUNNEL_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.purple : index === FUNNEL_DATA.length - 1 ? COLORS.green : COLORS.blue} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <div className="col-span-12 lg:col-span-4 space-y-6">
                <Card>
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Análise de Drop-off</h3>
                    <p className="text-3xl font-bold text-white mb-1">32%</p>
                    <p className="text-sm text-gray-500 mb-4">Usuários desistem entre "Ativado" e "1º Valor".</p>
                    
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-[32%] bg-red-500/80"></div>
                    </div>
                </Card>

                <Card>
                     <h3 className="text-sm font-semibold text-gray-300 mb-2">Tempo para Valor</h3>
                     <p className="text-3xl font-bold text-white mb-1">4.2 <span className="text-sm font-normal text-gray-500">horas</span></p>
                     <p className="text-sm text-neon-green mt-1">-12% vs mês passado</p>
                </Card>
            </div>
        </div>
    </div>
  );
};

export default Funnel;