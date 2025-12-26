import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Zap, Activity, Coins, Clock, AlertTriangle, Terminal, GitBranch, Play, Settings, Cpu, ScrollText, Check, X, Sliders, Gamepad2, ArrowDown, Tag, Copy } from 'lucide-react';
import Card from '../components/ui/Card';
import { AgentStatus, AgentVersion, Agent } from '../types';
import { useAgentStore } from '../store/useAgentStore';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, BarChart, Bar, Cell } from 'recharts';
import { COLORS, MODEL_REGISTRY } from '../constants';
import AgentPlayground from '../components/Agents/AgentPlayground';
import AgentLogs from '../components/Agents/AgentLogs';
import { useToastStore } from '../store/useToastStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

const AgentProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { agents, updateAgent } = useAgentStore();
    const { addToast } = useToastStore();
    
    // Removed isPlaygroundOpen state as it's now a tab
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const agent = agents.find(a => a.id === id);

    // Config Form State
    const [configForm, setConfigForm] = useState<Partial<Agent>>({});

    const openConfig = () => {
        if (agent) {
            setConfigForm({
                model: agent.model,
                status: agent.status,
                systemPrompt: agent.systemPrompt || '',
                temperature: agent.temperature || 0.7
            });
            setIsConfigOpen(true);
        }
    };

    const handleConfigSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (agent && agent.id) {
            updateAgent(agent.id, configForm);
            addToast({ type: 'success', title: 'Agente Reconfigurado', message: 'Novos parâmetros de comportamento aplicados.' });
            setIsConfigOpen(false);
        }
    };

    const handleCopyPrompt = () => {
        if (agent?.systemPrompt) {
            navigator.clipboard.writeText(agent.systemPrompt);
            addToast({ type: 'success', title: 'Copiado!', message: 'System Prompt copiado para a área de transferência.' });
        }
    };

    // Group models by provider for select
    const groupedModels = useMemo(() => {
        type ModelEntry = typeof MODEL_REGISTRY[string] & { id: string };
        const groups: Record<string, ModelEntry[]> = {};
        Object.entries(MODEL_REGISTRY).forEach(([key, value]) => {
            const entry = { ...value, id: key };
            if (!groups[value.provider]) groups[value.provider] = [];
            groups[value.provider].push(entry);
        });
        return groups;
    }, []);

    // Get current selected model pricing info in config form
    const selectedModelInfo = MODEL_REGISTRY[configForm.model || 'gpt-4o'];

    if (!agent) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-gray-500">
                <p>Agente não encontrado.</p>
                <button onClick={() => navigate('/agents')} className="mt-4 text-neon-cyan hover:underline">
                    Voltar para lista
                </button>
            </div>
        );
    }

    // Mock Data for Charts
    const LATENCY_DATA = [
        { name: '00:00', value: agent.avgLatency - 50 },
        { name: '04:00', value: agent.avgLatency + 20 },
        { name: '08:00', value: agent.avgLatency + 150 },
        { name: '12:00', value: agent.avgLatency - 10 },
        { name: '16:00', value: agent.avgLatency + 80 },
        { name: '20:00', value: agent.avgLatency - 30 },
        { name: '23:59', value: agent.avgLatency },
    ];

    const ERROR_DATA = [
        { name: 'Timeout', value: 12 },
        { name: 'Rate Limit', value: 5 },
        { name: 'Bad Output', value: 8 },
        { name: 'API Error', value: 2 },
    ];

    // Mock Versions Data
    const MOCK_VERSIONS: AgentVersion[] = [
        { version: 'v1.2.0', createdAt: 'Hoje, 14:30', model: agent.model, changeLog: 'Ajuste de temperatura para 0.7 e novo prompt de sistema.', status: 'active' },
        { version: 'v1.1.5', createdAt: 'Ontem, 09:15', model: agent.model, changeLog: 'Correção no output JSON.', status: 'archived' },
        { version: 'v1.0.0', createdAt: '3 dias atrás', model: 'gpt-3.5-turbo', changeLog: 'Versão inicial.', status: 'archived' },
    ];

    const getStatusBadge = (status: AgentStatus) => {
        switch (status) {
            case AgentStatus.ONLINE:
                return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neon-green/10 text-neon-green border border-neon-green/30">Online</span>;
            case AgentStatus.MAINTENANCE:
                return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">Manutenção</span>;
            case AgentStatus.TRAINING:
                return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neon-blue/10 text-neon-blue border border-neon-blue/30 flex items-center gap-1"><Zap size={10}/> Treinando</span>;
            default:
                return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-500/10 text-gray-400 border border-gray-500/30">Offline</span>;
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto pb-20">
            {/* Config Modal */}
            {isConfigOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-[#111625] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                         <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/5 rounded-lg text-white">
                                    <Sliders size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-white font-display">Engenharia do Agente</h3>
                            </div>
                            <button onClick={() => setIsConfigOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleConfigSave} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Modelo Base</label>
                                    <div className="relative">
                                        <select 
                                            value={configForm.model} 
                                            onChange={(e) => setConfigForm({...configForm, model: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none [&>option]:bg-dark-bg appearance-none pr-8"
                                        >
                                            {Object.entries(groupedModels).map(([provider, models]: [string, any[]]) => (
                                                <optgroup key={provider} label={provider} className="text-gray-500 font-bold bg-dark-bg">
                                                    {models.map(m => (
                                                        <option key={m.id} value={m.id} className="text-white bg-dark-bg">
                                                            {m.label}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-2.5 pointer-events-none text-gray-500"><ArrowDown size={14} /></div>
                                    </div>
                                    
                                    {/* Pricing Display */}
                                    {selectedModelInfo && (
                                        <div className="mt-2 text-[10px] text-gray-400 flex items-center justify-between px-1">
                                            <span>{selectedModelInfo.provider}</span>
                                            <span className="font-mono">
                                                IN: <span className="text-neon-cyan">${selectedModelInfo.inputPrice.toFixed(2)}</span> / 
                                                OUT: <span className="text-neon-purple">${selectedModelInfo.outputPrice.toFixed(2)}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Criatividade (Temperatura): {configForm.temperature}
                                    </label>
                                    <input 
                                        type="range" 
                                        min="0" max="1" step="0.1"
                                        value={configForm.temperature} 
                                        onChange={(e) => setConfigForm({...configForm, temperature: parseFloat(e.target.value)})}
                                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500">
                                        <span>Preciso (0.0)</span>
                                        <span>Criativo (1.0)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Terminal size={12} /> System Prompt (Instruções Mestre)
                                </label>
                                <textarea 
                                    value={configForm.systemPrompt}
                                    onChange={(e) => setConfigForm({...configForm, systemPrompt: e.target.value})}
                                    className="w-full h-64 bg-[#080a12] border border-white/10 rounded-lg p-4 text-sm text-gray-300 focus:border-neon-cyan focus:outline-none font-mono resize-none leading-relaxed"
                                    placeholder="Defina a personalidade e regras do agente aqui..."
                                />
                                <p className="text-xs text-gray-500">
                                    Dica: Use XML tags como &lt;rules&gt; ou &lt;context&gt; para melhor estruturação em modelos Claude.
                                </p>
                            </div>

                            <div className="pt-2 flex justify-end gap-3 border-t border-white/5 mt-4">
                                <button type="button" onClick={() => setIsConfigOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-neon-cyan text-dark-bg font-bold rounded text-sm hover:bg-neon-blue flex items-center gap-2">
                                    <Check size={16} /> Aplicar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Back Navigation */}
            <div className="mb-2">
                <button 
                    onClick={() => navigate('/agents')} 
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar para Agentes
                </button>
            </div>

            {/* Header Section (Ultra Compacted) */}
            <Card className="mb-4 p-4 border-white/10 bg-white/[0.02] relative overflow-hidden">
                 {/* Decorative background glow */}
                 <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl"></div>

                 <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center shadow-lg shrink-0">
                            <Bot size={24} className="text-neon-cyan" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-0.5">
                                <h1 className="text-xl font-bold font-display text-white">{agent.name}</h1>
                                {getStatusBadge(agent.status)}
                            </div>
                            <p className="text-gray-400 text-xs">{agent.description}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-gray-500">
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                                    <Terminal size={10} /> {MODEL_REGISTRY[agent.model]?.label || agent.model}
                                </span>
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                                    <Clock size={10} /> Último uso: {agent.lastUsed}
                                </span>
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                                    Temp: {agent.temperature || 0.7}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-2 md:mt-0">
                        <button 
                            onClick={openConfig}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs text-white transition-all"
                        >
                            <Settings size={14} /> Configurar
                        </button>
                    </div>
                 </div>
            </Card>

            {/* NEW TABS COMPONENT */}
            <Tabs defaultValue="monitoramento">
                <TabsList>
                    <TabsTrigger value="monitoramento" icon={<Activity size={16} />}>Monitoramento</TabsTrigger>
                    <TabsTrigger value="playground" icon={<Gamepad2 size={16} />}>Playground</TabsTrigger>
                    <TabsTrigger value="engenharia" icon={<GitBranch size={16} />}>Engenharia & Versões</TabsTrigger>
                </TabsList>

                {/* TAB 1: MONITORAMENTO (KPIs + Charts + Logs) */}
                <TabsContent value="monitoramento">
                     {/* KPI Grid (Compacted) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-24 relative group overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-neon-blue">
                                <Zap size={64} />
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Zap size={16} className="text-neon-blue" />
                                <span className="text-[10px] uppercase tracking-wider font-semibold">Latência Média</span>
                            </div>
                            <div>
                                <span className="text-2xl font-display font-bold text-white">{agent.avgLatency}</span>
                                <span className="text-xs text-gray-500 ml-1">ms</span>
                            </div>
                            <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-neon-blue" style={{ width: '65%' }}></div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-24 relative group overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-neon-purple">
                                <Cpu size={64} />
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Cpu size={16} className="text-neon-purple" />
                                <span className="text-[10px] uppercase tracking-wider font-semibold">Consumo Tokens</span>
                            </div>
                            <div>
                                <span className="text-2xl font-display font-bold text-white">{(agent.totalTokens / 1000).toFixed(1)}k</span>
                                <span className="text-xs text-gray-500 ml-1">total</span>
                            </div>
                            <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-neon-purple" style={{ width: '45%' }}></div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-24 relative group overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-neon-green">
                                <Activity size={64} />
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Activity size={16} className="text-neon-green" />
                                <span className="text-[10px] uppercase tracking-wider font-semibold">Sucesso</span>
                            </div>
                            <div>
                                <span className="text-2xl font-display font-bold text-white">{agent.successRate}%</span>
                                <span className="text-[10px] text-neon-green ml-2 font-mono">+0.2%</span>
                            </div>
                            <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-neon-green" style={{ width: `${agent.successRate}%` }}></div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-24 relative group overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-neon-pink">
                                <Coins size={64} />
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Coins size={16} className="text-neon-pink" />
                                <span className="text-[10px] uppercase tracking-wider font-semibold">Custo Total</span>
                            </div>
                            <div>
                                <span className="text-2xl font-display font-bold text-white">R$ {agent.cost.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-neon-pink" style={{ width: '30%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Latency Chart */}
                        <Card className="lg:col-span-2 min-h-[350px]">
                            <h3 className="text-lg font-medium text-white mb-6">Latência em Tempo Real (ms)</h3>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={LATENCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#374151', color: '#fff' }} />
                                        <Area type="monotone" dataKey="value" stroke={COLORS.blue} strokeWidth={2} fill="url(#colorLatency)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                        
                        {/* Errors Breakdown */}
                        <Card className="min-h-[350px]">
                            <h3 className="text-lg font-medium text-white mb-6">Classificação de Erros</h3>
                            <div className="h-[200px] w-full mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ERROR_DATA} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{fill: '#9ca3af', fontSize: 11}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#374151', color: '#fff' }} />
                                        <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                            {ERROR_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.pink : COLORS.purple} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="text-yellow-500 shrink-0 mt-1" size={16} />
                                    <div>
                                        <p className="text-sm font-bold text-white">Alerta de Timeout</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            12 timeouts registrados nas últimas 24h. Verifique a configuração de <code>max_tokens</code>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><ScrollText size={18}/> Logs Recentes</h3>
                    <AgentLogs />
                </TabsContent>

                {/* TAB 2: PLAYGROUND (Dedicated) */}
                <TabsContent value="playground">
                    <AgentPlayground agent={agent} />
                </TabsContent>

                {/* TAB 3: ENGENHARIA (Prompts + Versions) */}
                <TabsContent value="engenharia">
                     <div className="max-w-4xl">
                        {/* System Prompt Preview (Real Data) */}
                        <Card className="mb-6 border-l-4 border-l-neon-cyan">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Terminal size={14} /> System Prompt Atual
                                </h3>
                                <button 
                                    onClick={handleCopyPrompt}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all"
                                >
                                    <Copy size={12} /> Copiar
                                </button>
                            </div>
                            <div className="bg-black/30 rounded p-4 border border-white/10 font-mono text-xs text-gray-300 whitespace-pre-wrap">
                                {agent.systemPrompt || "Nenhum prompt definido."}
                            </div>
                        </Card>

                        <h3 className="text-lg font-medium text-white mb-4">Histórico de Versões</h3>
                        <div className="space-y-4">
                            {MOCK_VERSIONS.map((version, idx) => (
                                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${version.status === 'active' ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-gray-700 text-gray-400'}`}>
                                                {version.version}
                                            </span>
                                            <span className="text-sm font-semibold text-white">{version.model}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock size={12} /> {version.createdAt}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2 border-l-2 border-white/10 pl-3">
                                        {version.changeLog}
                                    </p>
                                    {version.status !== 'active' && (
                                        <button className="mt-3 text-xs text-neon-cyan hover:underline flex items-center gap-1">
                                            <RotateCcwIcon /> Restaurar esta versão
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Helper icon component
const RotateCcwIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12"/><path d="M3 5v7h7"/></svg>
);

export default AgentProfile;