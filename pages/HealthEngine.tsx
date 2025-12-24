import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { Activity, Zap, MessageSquare, DollarSign, AlertTriangle, RotateCcw, Sliders } from 'lucide-react';
import { YEARLY_TREND_DATA, COLORS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useHealthStore, HealthWeights } from '../store/useHealthStore';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';

// --- MOCK DATA FOR NEW TABS ---
const DAILY_DATA = [
    { name: '00h', value: 82 }, { name: '03h', value: 81 }, { name: '06h', value: 83 },
    { name: '09h', value: 88 }, { name: '12h', value: 92 }, { name: '15h', value: 90 },
    { name: '18h', value: 94 }, { name: '21h', value: 91 }, { name: '23h', value: 89 }
];

const WEEKLY_DATA = [
    { name: 'Semana 1', value: 84 },
    { name: 'Semana 2', value: 86 },
    { name: 'Semana 3', value: 82 },
    { name: 'Semana 4', value: 89 }
];

// Helper for Tailwind classes to ensure they exist and aren't purged
const getThemeColors = (color: string) => {
    const map: Record<string, { bg: string, text: string, bar: string, border: string }> = {
        'neon-blue': { bg: 'bg-neon-blue/10', text: 'text-neon-blue', bar: 'bg-neon-blue', border: 'border-neon-blue' },
        'neon-green': { bg: 'bg-neon-green/10', text: 'text-neon-green', bar: 'bg-neon-green', border: 'border-neon-green' },
        'neon-purple': { bg: 'bg-neon-purple/10', text: 'text-neon-purple', bar: 'bg-neon-purple', border: 'border-neon-purple' },
        'neon-pink': { bg: 'bg-neon-pink/10', text: 'text-neon-pink', bar: 'bg-neon-pink', border: 'border-neon-pink' },
    };
    return map[color] || map['neon-blue'];
};

const HealthFactor = ({ 
    id,
    label, 
    score, 
    weight, 
    icon: Icon, 
    color,
    isEditing,
    onWeightChange
}: { 
    id: keyof HealthWeights,
    label: string, 
    score: number, 
    weight: number, 
    icon: any, 
    color: string,
    isEditing: boolean,
    onWeightChange: (val: number) => void
}) => {
    const theme = getThemeColors(color);
    
    return (
        <div className={`flex flex-col p-5 bg-white/[0.02] rounded-xl border ${isEditing ? 'border-white/20' : 'border-white/5'} hover:border-white/10 transition-colors h-full`}>
            <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg ${theme.bg} ${theme.text} mt-1 shrink-0`}>
                    <Icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-base font-medium text-white leading-tight truncate pr-2">{label}</span>
                        <span className="text-xl font-display font-bold text-white shrink-0">{score}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${theme.bar} shadow-[0_0_10px_rgba(0,0,0,0.3)]`} style={{ width: `${score}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Weights Control Section */}
            <div className={`mt-auto pt-4 border-t border-white/5 transition-all duration-300 ${isEditing ? 'opacity-100' : 'opacity-60'}`}>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Peso no Score Global</span>
                    <span className={`text-sm font-mono font-bold ${theme.text}`}>{weight}%</span>
                </div>
                
                {isEditing ? (
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="5"
                        value={weight} 
                        onChange={(e) => onWeightChange(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:accent-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
                    />
                ) : (
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-500" style={{ width: `${weight}%` }}></div>
                    </div>
                )}
            </div>
        </div>
    );
};

type ChartPeriod = 'day' | 'week' | 'year';

const HealthEngine: React.FC = () => {
    const { addToast } = useToastStore();
    const { recalculateAllScores } = useUserStore(); // Hook into User Store
    
    const { 
        factors, 
        weights, 
        globalScore, 
        isEditingWeights, 
        toggleEditWeights, 
        setWeight,
        resetDefaults
    } = useHealthStore();

    // Trigger recalculation in User Store whenever weights change
    useEffect(() => {
        recalculateAllScores(weights);
    }, [weights, recalculateAllScores]);

    // State for Chart Tabs
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('year');

    const handleToggleEdit = () => {
        if (isEditingWeights) {
            // Saving
            addToast({
                type: 'success',
                title: 'Pesos Atualizados',
                message: 'A nova configuração do algoritmo foi aplicada a toda a base de usuários.'
            });
        }
        toggleEditWeights();
    };

    const handleReset = () => {
        resetDefaults();
        addToast({
            type: 'info',
            title: 'Padrões Restaurados',
            message: 'Os pesos voltaram à configuração original de fábrica.'
        });
    };

    // Determine data based on active tab
    const chartData = chartPeriod === 'day' 
        ? DAILY_DATA 
        : chartPeriod === 'week' 
            ? WEEKLY_DATA 
            : YEARLY_TREND_DATA;

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-20">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white">Motor de Saúde</h1>
                    <p className="text-gray-500 text-sm mt-1">Configure como o Health Score é calculado.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleReset}
                        className="px-4 py-2 flex items-center gap-2 bg-white/5 border border-white/10 rounded text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <RotateCcw size={14} /> Resetar Padrões
                    </button>
                    <button 
                        onClick={handleToggleEdit}
                        className={`
                            px-4 py-2 flex items-center gap-2 border rounded text-sm transition-all shadow-lg
                            ${isEditingWeights 
                                ? 'bg-neon-cyan text-dark-bg border-neon-cyan font-bold shadow-[0_0_15px_rgba(124,252,243,0.3)]' 
                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}
                        `}
                    >
                        <Sliders size={14} /> {isEditingWeights ? 'Salvar Configuração' : 'Ajustar Pesos'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left Column: Composition */}
                <div className="col-span-12 xl:col-span-8">
                     <Card className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-white">Composição do Score</h3>
                            {isEditingWeights && <span className="text-xs text-neon-cyan animate-pulse">Modo de Edição Ativo</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <HealthFactor 
                                id="engagement"
                                label="Engajamento de Produto" 
                                score={factors.engagement} 
                                weight={weights.engagement} 
                                icon={Zap} 
                                color="neon-blue" 
                                isEditing={isEditingWeights}
                                onWeightChange={(val) => setWeight('engagement', val)}
                            />
                            <HealthFactor 
                                id="support"
                                label="Histórico de Suporte" 
                                score={factors.support} 
                                weight={weights.support} 
                                icon={MessageSquare} 
                                color="neon-green" 
                                isEditing={isEditingWeights}
                                onWeightChange={(val) => setWeight('support', val)}
                            />
                            <HealthFactor 
                                id="finance"
                                label="Saúde Financeira" 
                                score={factors.finance} 
                                weight={weights.finance} 
                                icon={DollarSign} 
                                color="neon-purple" 
                                isEditing={isEditingWeights}
                                onWeightChange={(val) => setWeight('finance', val)}
                            />
                            <HealthFactor 
                                id="risk"
                                label="Padrões de Risco (Churn)" 
                                score={factors.risk} 
                                weight={weights.risk} 
                                icon={AlertTriangle} 
                                color="neon-pink" 
                                isEditing={isEditingWeights}
                                onWeightChange={(val) => setWeight('risk', val)}
                            />
                        </div>
                    </Card>
                </div>

                {/* Right Column: Calibration Metrics */}
                <div className="col-span-12 xl:col-span-4">
                    <Card className="h-full flex flex-col bg-white/[0.04]">
                        <h3 className="text-lg font-medium text-white mb-6">Simulação em Tempo Real</h3>
                        
                        <div className="flex-1 flex flex-col justify-center gap-6">
                            {/* Stats Grid */}
                            <div className="flex flex-col items-center justify-center py-8">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Novo Score Global</p>
                                <div className="relative">
                                     <div className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full"></div>
                                     <p className="relative text-7xl font-display font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                        {globalScore}
                                     </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-dark-bg border border-white/5 flex flex-col justify-center">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Impacto Engajamento</p>
                                    <p className="text-xl font-display font-bold text-neon-blue">{((factors.engagement * weights.engagement)/100).toFixed(1)}pts</p>
                                </div>
                                <div className="p-4 rounded-xl bg-dark-bg border border-white/5 flex flex-col justify-center">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Impacto Financeiro</p>
                                    <p className="text-xl font-display font-bold text-neon-purple">{((factors.finance * weights.finance)/100).toFixed(1)}pts</p>
                                </div>
                            </div>

                            {/* Insight Box */}
                            <div className="p-5 bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl flex-1 flex items-center">
                                <p className="text-sm text-neon-cyan leading-relaxed flex gap-3">
                                    <Activity size={20} className="shrink-0 mt-0.5" />
                                    <span>
                                        {isEditingWeights 
                                            ? "Qualquer alteração aqui afeta o cálculo do Score de Saúde de TODOS os usuários em tempo real."
                                            : "O modelo está calibrado. O peso de 'Engajamento' é o maior influenciador atual."}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
                
                {/* Bottom Row: Dynamic Chart */}
                <div className="col-span-12">
                     <Card className="min-h-[350px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h3 className="text-lg font-semibold text-gray-200">
                                {isEditingWeights ? 'Projeção (Com novos pesos)' : 'Histórico de Tendência'}
                            </h3>

                            {/* Chart Tabs */}
                            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                                <button 
                                    onClick={() => setChartPeriod('day')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartPeriod === 'day' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    24 Horas
                                </button>
                                <button 
                                    onClick={() => setChartPeriod('week')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartPeriod === 'week' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Mês (4 Semanas)
                                </button>
                                <button 
                                    onClick={() => setChartPeriod('year')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${chartPeriod === 'year' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Ano
                                </button>
                            </div>
                        </div>

                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke={COLORS.purple} 
                                        strokeWidth={2} 
                                        fill="url(#colorValue)" 
                                        animationDuration={500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default HealthEngine;