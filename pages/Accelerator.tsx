import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Gauge from '../components/Accelerator/Gauge';
import { useUserStore } from '../store/useUserStore';
import { useAcceleratorStore } from '../store/useAcceleratorStore';
import { Rocket, Target, Users, Zap, TrendingUp, Edit2, Check, RotateCcw, Lock, Plus, Trash2, X, Save, Calendar, Clock, Trophy, Crown, ArrowRight, Star } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';
import { UserStatus, Mission } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti'; // Se não tiver instalado, usamos uma animação CSS fallback ou removemos. Como não posso instalar pacotes, usarei animação CSS/Framer.

const Accelerator: React.FC = () => {
    const { users } = useUserStore();
    const { missions, activeMissionId, updateMission, addMission, deleteMission, setActiveMission, completeMission, resetMissions } = useAcceleratorStore();
    const { addToast } = useToastStore();

    // Estado do Modal de Edição
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Estado do Modal de Vitória (Gamificação)
    const [showVictoryModal, setShowVictoryModal] = useState(false);

    // Formulário
    const [form, setForm] = useState({
        title: '',
        description: '',
        target: 0,
        durationMonths: 3,
        startDate: ''
    });

    const activeMission = missions.find(m => m.id === activeMissionId) || missions[0] || { title: 'Nenhuma Missão', description: 'Crie uma nova missão.', target: 100, durationMonths: 3 };

    // --- CÁLCULO DE USUÁRIOS VÁLIDOS ---
    const validUsers = useMemo(() => {
        return users.filter(u => u.status !== UserStatus.CHURNED);
    }, [users]);

    const activeCount = validUsers.length;

    // --- CÁLCULO DE VITÓRIA / GAMIFICAÇÃO ---
    useEffect(() => {
        // Se a contagem atingiu a meta E a missão ainda está ativa (não completada)
        if (activeMission && activeMission.status === 'active' && activeCount >= activeMission.target) {
            setShowVictoryModal(true);
        }
    }, [activeCount, activeMission]);

    // --- CÁLCULO TEMPORAL ---
    const timeMetrics = useMemo(() => {
        if (!activeMission.startDate) return null;
        
        const start = new Date(activeMission.startDate);
        const end = new Date(start);
        end.setMonth(start.getMonth() + activeMission.durationMonths);
        
        const now = new Date();
        const totalDurationMs = end.getTime() - start.getTime();
        const elapsedMs = now.getTime() - start.getTime();
        
        if (elapsedMs < 0) {
            return {
                daysRemaining: Math.ceil(totalDurationMs / (1000 * 60 * 60 * 24)),
                progress: 0,
                status: 'future',
                endDate: end
            };
        }

        const progress = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));
        const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        return {
            daysRemaining,
            progress,
            status: daysRemaining === 0 ? 'ended' : 'running',
            endDate: end
        };
    }, [activeMission]);

    // --- OUTROS CÁLCULOS ---
    const healthMetric = useMemo(() => {
        if (activeCount === 0) return 0;
        const riskyUsers = validUsers.filter(u => u.status === UserStatus.RISK || u.status === UserStatus.GHOST).length;
        const healthyCount = activeCount - riskyUsers;
        return (healthyCount / activeCount) * 100;
    }, [activeCount, validUsers]);

    const growthSpeed = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return validUsers.filter(u => new Date(u.joinedAt) >= sevenDaysAgo).length;
    }, [validUsers]);

    // --- HANDLERS ---

    const handleOpenCreate = () => {
        setEditingId(null);
        setForm({ 
            title: '', 
            description: '', 
            target: 100, 
            durationMonths: 3,
            startDate: new Date().toISOString().split('T')[0] 
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (e: React.MouseEvent, mission: Mission) => {
        e.stopPropagation();
        setEditingId(mission.id);
        setForm({
            title: mission.title,
            description: mission.description,
            target: mission.target,
            durationMonths: mission.durationMonths,
            startDate: mission.startDate ? new Date(mission.startDate).toISOString().split('T')[0] : ''
        });
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...form,
            startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined
        };

        if (editingId) {
            updateMission(editingId, payload);
            addToast({ type: 'success', title: 'Missão Atualizada', message: 'As configurações foram salvas.' });
        } else {
            addMission(payload);
            addToast({ type: 'success', title: 'Missão Criada', message: 'Nova meta adicionada ao roteiro.' });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Tem certeza que deseja excluir esta missão?")) {
            deleteMission(id);
            addToast({ type: 'info', title: 'Missão Removida', message: 'O item foi excluído do roteiro.' });
        }
    };

    const handleSelectMission = (id: string) => {
        setActiveMission(id);
        addToast({ type: 'info', title: 'Foco Ajustado', message: 'Missão ativa alterada.' });
    };

    const handleReset = () => {
        if(confirm("Deseja restaurar as metas originais?")) {
            resetMissions();
            addToast({ type: 'warning', title: 'Reset', message: 'Metas restauradas.' });
        }
    };

    // --- GAMIFICATION HANDLERS ---
    const handleAdvanceMission = () => {
        // 1. Completar missão atual
        if (activeMissionId) {
            completeMission(activeMissionId);
        }

        // 2. Encontrar próxima missão
        const currentIndex = missions.findIndex(m => m.id === activeMissionId);
        const nextMission = missions[currentIndex + 1];

        if (nextMission) {
            setActiveMission(nextMission.id);
            addToast({ type: 'success', title: 'Nível Aumentado!', message: `Iniciando: ${nextMission.title}` });
        } else {
            addToast({ type: 'success', title: 'Zerou o Game!', message: 'Todas as missões foram concluídas. Hora de criar novas metas!' });
        }

        setShowVictoryModal(false);
    };

    const handleStayHere = () => {
        setShowVictoryModal(false);
        // Apenas fecha o modal, a missão continua ativa (talvez queira "farmar" mais score antes de pular)
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-20 relative">
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
                    <div className="flex justify-between items-start z-10 relative">
                        <div className="flex-1 pr-8">
                            <span className="px-2 py-1 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                                Missão Ativa
                            </span>
                            <h2 className="text-2xl font-bold text-white">{activeMission.title}</h2>
                            <p className="text-sm text-gray-400 max-w-md mt-1">{activeMission.description}</p>
                            
                            {timeMetrics && (
                                <div className="mt-4 flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5 max-w-sm">
                                    <div className="p-2 bg-white/5 rounded text-gray-400">
                                        <Clock size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-400">Tempo de Missão</span>
                                            <span className={`font-bold ${timeMetrics.daysRemaining < 30 ? 'text-yellow-500' : 'text-white'}`}>
                                                {timeMetrics.daysRemaining} dias restantes
                                            </span>
                                        </div>
                                        <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${timeMetrics.progress > 80 ? 'bg-red-500' : 'bg-gray-500'} transition-all duration-1000`} 
                                                style={{ width: `${timeMetrics.progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[9px] text-gray-600">Início: {new Date(activeMission.startDate!).toLocaleDateString()}</span>
                                            <span className="text-[9px] text-gray-600">Fim: {timeMetrics.endDate.toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Alvo Trimestral</p>
                            <p className="text-4xl font-display font-bold text-white">{activeMission.target}</p>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-center pb-8">
                        <Gauge current={activeCount} target={activeMission.target} label="Base Ativa Validada" />
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-neon-cyan/5 to-transparent pointer-events-none"></div>
                </Card>

                {/* --- SIDEBAR STATS --- */}
                <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                    <Card className="flex-1 flex flex-col justify-center relative overflow-hidden border-white/5">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={64} className="text-white" /></div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={16} className="text-neon-purple"/> Saúde da Base</h3>
                        <div className="flex items-end gap-4 mb-2">
                            <span className={`text-5xl font-display font-bold ${healthMetric > 80 ? 'text-neon-green' : healthMetric > 60 ? 'text-yellow-500' : 'text-red-500'}`}>{healthMetric.toFixed(0)}%</span>
                            <span className="text-sm text-gray-500 mb-2">qualidade real</span>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-4">
                            <div className={`h-full transition-all duration-1000 ${healthMetric > 80 ? 'bg-neon-green' : healthMetric > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${healthMetric}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{healthMetric > 80 ? "Base saudável. Maioria engajada." : "Atenção: Risco elevado na base."}</p>
                    </Card>

                    <Card className="flex-1 flex flex-col justify-center relative overflow-hidden border-white/5">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={64} className="text-neon-cyan" /></div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-neon-cyan"/> Velocidade (7d)</h3>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl font-display font-bold text-white">+{growthSpeed}</span>
                            <span className="text-sm text-gray-500">novos usuários</span>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5 mt-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">Projeção Mensal</span>
                                <span className="text-neon-cyan font-bold">~{growthSpeed * 4} novos</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* --- MISSIONS LIST --- */}
                <div className="col-span-12 mt-4">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-lg font-bold text-white">Roteiro de Missões</h3>
                        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-3 py-1.5 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-lg text-xs font-bold hover:bg-neon-cyan/20 transition-all uppercase tracking-wide"><Plus size={14} /> Nova Missão</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {missions.map((mission) => {
                            const isActive = mission.id === activeMissionId;
                            const isCompleted = mission.status === 'completed';
                            const progress = Math.min(100, (activeCount / mission.target) * 100);

                            return (
                                <div key={mission.id} onClick={() => handleSelectMission(mission.id)} className={`relative p-5 rounded-xl border transition-all duration-300 cursor-pointer group overflow-hidden ${isActive ? 'bg-gradient-to-br from-neon-cyan/10 to-transparent border-neon-cyan/50 shadow-[0_0_20px_rgba(124,252,243,0.1)]' : isCompleted ? 'bg-neon-green/5 border-neon-green/20 opacity-60 hover:opacity-80' : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'}`}>
                                    {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan"></div>}
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className={`font-bold text-sm line-clamp-1 pr-2 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{mission.title}</h4>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isCompleted ? <Check size={16} className="text-neon-green" /> : isActive ? <Zap size={16} className="text-neon-cyan animate-pulse"/> : <Lock size={14} className="text-gray-600"/>}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-2xl font-display font-bold text-white">{mission.target}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Meta Ativos</p>
                                    </div>
                                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mb-3">
                                        <div className={`h-full ${isCompleted ? 'bg-neon-green' : isActive ? 'bg-neon-cyan' : 'bg-gray-600'}`} style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                                        <span>{progress.toFixed(0)}% • {mission.durationMonths} meses</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleOpenEdit(e, mission)} className="p-1 hover:text-white hover:bg-white/10 rounded"><Edit2 size={12} /></button>
                                            <button onClick={(e) => handleDelete(e, mission.id)} className="p-1 hover:text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- MODAL DE VITÓRIA (GAMIFICAÇÃO) --- */}
            <AnimatePresence>
                {showVictoryModal && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="relative w-full max-w-lg bg-[#0B0F1A] border-2 border-neon-cyan/50 rounded-2xl shadow-[0_0_100px_rgba(124,252,243,0.3)] overflow-hidden"
                        >
                            {/* Efeito de Confete/Luz de Fundo */}
                            <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/20 via-transparent to-transparent pointer-events-none"></div>
                            
                            <div className="relative z-10 p-8 flex flex-col items-center text-center">
                                <div className="mb-6 relative">
                                    <div className="absolute inset-0 bg-neon-cyan/30 blur-3xl rounded-full animate-pulse"></div>
                                    <Trophy size={80} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] relative z-10" />
                                    <div className="absolute -top-2 -right-2">
                                        <Crown size={32} className="text-neon-cyan animate-bounce" />
                                    </div>
                                </div>

                                <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-wide uppercase">
                                    Missão Cumprida!
                                </h2>
                                <p className="text-gray-300 text-lg mb-6">
                                    Você atingiu a marca de <strong className="text-neon-cyan">{activeMission.target} usuários ativos</strong> validada.
                                </p>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full mb-8 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-neon-green/20 rounded-lg text-neon-green">
                                            <Check size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-400 uppercase">Concluído</p>
                                            <p className="font-bold text-white">{activeMission.title}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase">Bônus</p>
                                        <p className="font-bold text-yellow-400 flex items-center justify-end gap-1"><Star size={14} fill="currentColor"/> XP</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 w-full">
                                    <button 
                                        onClick={handleStayHere}
                                        className="flex-1 py-3 bg-transparent border border-white/20 text-gray-400 hover:text-white hover:border-white/40 rounded-xl font-bold transition-all text-sm"
                                    >
                                        Permanecer Aqui
                                    </button>
                                    <button 
                                        onClick={handleAdvanceMission}
                                        className="flex-1 py-3 bg-neon-cyan text-dark-bg border border-neon-cyan hover:bg-neon-blue hover:border-neon-blue rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(124,252,243,0.4)] text-sm flex items-center justify-center gap-2 group"
                                    >
                                        Aceitar Promoção <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MANAGEMENT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-[#111625] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h3 className="text-lg font-bold text-white font-display">
                                {editingId ? 'Editar Missão' : 'Nova Missão'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Título da Missão</label>
                                <input type="text" required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none" placeholder="Ex: Missão 5" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Descrição</label>
                                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none h-20 resize-none" placeholder="Descrição..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Data Início</label>
                                    <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none [color-scheme:dark]" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Duração (Meses)</label>
                                    <input type="number" required min="1" value={form.durationMonths} onChange={(e) => setForm({...form, durationMonths: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Meta (Usuários)</label>
                                <input type="number" required min="1" value={form.target} onChange={(e) => setForm({...form, target: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none" />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-neon-cyan text-dark-bg font-bold rounded text-sm hover:bg-neon-blue flex items-center gap-2"><Save size={16} /> Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accelerator;
