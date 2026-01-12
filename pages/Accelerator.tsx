import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Gauge from '../components/Accelerator/Gauge';
import { useUserStore } from '../store/useUserStore';
import { useAcceleratorStore } from '../store/useAcceleratorStore';
import { Rocket, Target, Users, Zap, TrendingUp, AlertTriangle, Edit2, Check, RotateCcw, Lock } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';
import { UserStatus } from '../types';

const Accelerator: React.FC = () => {
    const { users } = useUserStore();
    const { missions, activeMissionId, updateMissionTarget, setActiveMission, resetMissions } = useAcceleratorStore();
    const { addToast } = useToastStore();

    // Estado local para edição
    const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
    const [tempTarget, setTempTarget] = useState<number>(0);

    const activeMission = missions.find(m => m.id === activeMissionId) || missions[0];

    // --- CÁLCULO DE USUÁRIOS VÁLIDOS ---
    // Regra: Exclui Cancelados. Inclui Ativos, Novos, Risco, Fantasma.
    const validUsers = useMemo(() => {
        return users.filter(u => u.status !== UserStatus.CHURNED);
    }, [users]);

    const activeCount = validUsers.length;

    // --- CÁLCULO DE SAÚDE DA BASE ---
    // Saúde = (Ativos - Risco - Fantasma) / Ativos Válidos
    const healthMetric = useMemo(() => {
        if (activeCount === 0) return 0;
        const riskyUsers = validUsers.filter(u => u.status === UserStatus.RISK || u.status === UserStatus.GHOST).length;
        const healthyCount = activeCount - riskyUsers;
        return (healthyCount / activeCount) * 100;
    }, [activeCount, validUsers]);

    // --- CÁLCULO DE VELOCIDADE DE CRESCIMENTO (Últimos 7 dias) ---
    const growthSpeed = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const newUsersLastWeek = validUsers.filter(u => {
            const joinDate = new Date(u.joinedAt);
            return joinDate >= sevenDaysAgo;
        }).length;

        return newUsersLastWeek;
    }, [validUsers]);

    // Handlers
    const handleEditStart = (missionId: string, currentTarget: number) => {
        setEditingMissionId(missionId);
        setTempTarget(currentTarget);
    };

    const handleEditSave = () => {
        if (editingMissionId) {
            updateMissionTarget(editingMissionId, tempTarget);
            setEditingMissionId(null);
            addToast({ type: 'success', title: 'Meta Atualizada', message: 'O alvo da missão foi redefinido.' });
        }
    };

    const handleSelectMission = (id: string) => {
        setActiveMission(id);
        addToast({ type: 'info', title: 'Missão Alterada', message: 'O foco do acelerador foi ajustado.' });
    };

    const handleReset = () => {
        if(confirm("Deseja restaurar as metas originais?")) {
            resetMissions();
            addToast({ type: 'warning', title: 'Reset', message: 'Metas restauradas para o padrão de fábrica.' });
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-20">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
                        <Rocket className="text-neon-cyan" size={32} /> Meta Acelerador
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Instrumento de gestão de crescimento e performance.</p>
                </div>
                <button 
                    onClick={handleReset}
                    className="text-xs text-gray-600 hover:text-white flex items-center gap-1 transition-colors"
                >
                    <RotateCcw size={12} /> Restaurar Padrões
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* --- MAIN GAUGE --- */}
                <Card className="col-span-12 xl:col-span-8 bg-gradient-to-b from-[#0B0F1A] to-[#111625] border-white/5 relative overflow-hidden min-h-[500px] flex flex-col justify-between">
                    {/* Header da Missão Ativa */}
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <span className="px-2 py-1 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                                Missão Ativa
                            </span>
                            <h2 className="text-2xl font-bold text-white">{activeMission.title}</h2>
                            <p className="text-sm text-gray-400 max-w-md mt-1">{activeMission.description}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Alvo Trimestral</p>
                            {editingMissionId === activeMission.id ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <input 
                                        type="number" 
                                        value={tempTarget} 
                                        onChange={(e) => setTempTarget(Number(e.target.value))}
                                        className="bg-black/30 border border-neon-cyan/50 rounded px-2 py-1 text-white w-24 text-right font-mono"
                                        autoFocus
                                    />
                                    <button onClick={handleEditSave} className="p-1.5 bg-neon-cyan text-dark-bg rounded hover:bg-neon-blue"><Check size={14}/></button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => handleEditStart(activeMission.id, activeMission.target)}>
                                    <p className="text-3xl font-display font-bold text-white">{activeMission.target}</p>
                                    <Edit2 size={14} className="text-gray-600 group-hover:text-neon-cyan opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* O GRÁFICO */}
                    <div className="flex-1 flex items-end justify-center pb-8">
                        <Gauge 
                            current={activeCount} 
                            target={activeMission.target} 
                            label="Usuários Ativos Válidos"
                        />
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-neon-cyan/5 to-transparent pointer-events-none"></div>
                </Card>

                {/* --- SIDEBAR STATS --- */}
                <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                    {/* Card: Saúde da Base */}
                    <Card className="flex-1 flex flex-col justify-center relative overflow-hidden border-white/5">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users size={64} className="text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Target size={16} className="text-neon-purple"/> Saúde da Base
                        </h3>
                        
                        <div className="flex items-end gap-4 mb-2">
                            <span className={`text-5xl font-display font-bold ${healthMetric > 80 ? 'text-neon-green' : healthMetric > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {healthMetric.toFixed(0)}%
                            </span>
                            <span className="text-sm text-gray-500 mb-2">qualidade real</span>
                        </div>
                        
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-4">
                            <div 
                                className={`h-full transition-all duration-1000 ${healthMetric > 80 ? 'bg-neon-green' : healthMetric > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${healthMetric}%` }}
                            ></div>
                        </div>
                        
                        <p className="text-xs text-gray-400 leading-relaxed">
                            {healthMetric > 80 
                                ? "Base saudável. A maioria dos usuários ativos está engajada e sem risco."
                                : "Atenção: Alta concentração de usuários em risco ou fantasmas mascarando o número total."}
                        </p>
                    </Card>

                    {/* Card: Velocidade */}
                    <Card className="flex-1 flex flex-col justify-center relative overflow-hidden border-white/5">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap size={64} className="text-neon-cyan" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp size={16} className="text-neon-cyan"/> Velocidade (7d)
                        </h3>
                        
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl font-display font-bold text-white">+{growthSpeed}</span>
                            <span className="text-sm text-gray-500">novos usuários</span>
                        </div>

                        {/* Projeção Simplificada */}
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5 mt-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">Projeção Mensal (Ritmo Atual)</span>
                                <span className="text-neon-cyan font-bold">~{growthSpeed * 4} novos</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* --- MISSIONS LIST --- */}
                <div className="col-span-12 mt-4">
                    <h3 className="text-lg font-bold text-white mb-4 px-2">Roteiro de Missões 2026</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {missions.map((mission) => {
                            const isActive = mission.id === activeMissionId;
                            const isCompleted = mission.status === 'completed';
                            const progress = Math.min(100, (activeCount / mission.target) * 100);

                            return (
                                <div 
                                    key={mission.id}
                                    onClick={() => handleSelectMission(mission.id)}
                                    className={`
                                        relative p-5 rounded-xl border transition-all duration-300 cursor-pointer group overflow-hidden
                                        ${isActive 
                                            ? 'bg-gradient-to-br from-neon-cyan/10 to-transparent border-neon-cyan/50 shadow-[0_0_20px_rgba(124,252,243,0.1)]' 
                                            : isCompleted
                                                ? 'bg-neon-green/5 border-neon-green/20 opacity-60 hover:opacity-80'
                                                : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'}
                                    `}
                                >
                                    {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan"></div>}
                                    
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                            {mission.title}
                                        </h4>
                                        {isCompleted ? <Check size={16} className="text-neon-green" /> : isActive ? <Zap size={16} className="text-neon-cyan animate-pulse"/> : <Lock size={14} className="text-gray-600"/>}
                                    </div>
                                    
                                    <div className="mb-4">
                                        <p className="text-2xl font-display font-bold text-white">{mission.target}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Meta Ativos</p>
                                    </div>

                                    {/* Mini Progress Bar */}
                                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${isCompleted ? 'bg-neon-green' : isActive ? 'bg-neon-cyan' : 'bg-gray-600'}`} 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                                        <span>{progress.toFixed(0)}% Concluído</span>
                                        <span>{mission.durationMonths} meses</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Accelerator;
