import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MoreHorizontal, Shield, Clock, AlertTriangle, CheckCircle, Info, LayoutDashboard, History, Zap, MessageSquare, DollarSign, Target, CheckSquare, Flag, Edit2, ChevronRight, Award, Bot, Sparkles, BrainCircuit, Megaphone, Timer, Printer, Calendar, Crown, Rocket, Trophy, User as UserIcon, Flame } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { COLORS } from '../constants';
import { useUserStore } from '../store/useUserStore';
import { User, SuccessJourney, JourneyStep, UserStatus } from '../types';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../store/useToastStore';
import { analyzeJourney } from '../services/ai';

// --- RANKING LOGIC UTILS (Duplicated from RankingView for isolation) ---
const STAGE_WEIGHTS: Record<string, number> = {
    '1': 100, // Ativação
    '2': 250, // Método
    '3': 500, // Execução
    '4': 800, // Valor Gerado
    '5': 1000 // Escala
};

const calculateEngagementScore = (user: User): number => {
    let score = 0;
    score += (user.healthScore || 0) * 2;
    if (user.journey?.steps) {
        user.journey.steps.forEach(step => {
            if (step.isCompleted) {
                score += STAGE_WEIGHTS[step.id] || 50;
            }
        });
    }
    if (user.lastActive === 'Agora') score += 150;
    else {
        const lastActiveDate = new Date(user.lastActive);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 1) score += 100;
        else if (diffDays <= 3) score += 50;
        else if (diffDays <= 7) score += 20;
    }
    if (user.mrr > 0) score += Math.min(200, user.mrr / 10);
    return Math.round(score);
};

const getStageBadge = (user: User) => {
    const steps = user.journey?.steps || [];
    const completed = steps.filter(s => s.isCompleted);
    const lastCompleted = completed.length > 0 ? completed[completed.length - 1] : null;

    if (!lastCompleted) return { label: 'Setup', color: 'bg-gray-700 text-gray-300 border-gray-600', icon: Target };
    
    switch(lastCompleted.id) {
        case '5': return { label: 'Escala / Upsell', color: 'bg-neon-purple/20 text-neon-purple border-neon-purple/40 shadow-[0_0_10px_rgba(155,92,255,0.3)]', icon: Rocket };
        case '4': return { label: 'Valor Gerado', color: 'bg-neon-green/20 text-neon-green border-neon-green/40 shadow-[0_0_10px_rgba(52,255,176,0.3)]', icon: Trophy };
        case '3': return { label: 'Execução', color: 'bg-neon-blue/20 text-neon-blue border-neon-blue/40', icon: Zap };
        case '2': return { label: 'Método', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40', icon: Target };
        default: return { label: 'Ativação', color: 'bg-gray-700 text-white border-gray-500', icon: Target };
    }
};

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'journey'>('overview');
  
  // Fetch user from Global Store
  const { users, updateUser } = useUserStore();
  const user = users.find(u => u.id === id);

  // Local State for Journey Editing & AI
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Derived State for Alerts
  const [daysStagnant, setDaysStagnant] = useState(0);
  const [daysInactive, setDaysInactive] = useState(0);

  useEffect(() => {
      if (user?.journey?.coreGoal) {
          setTempGoal(user.journey.coreGoal);
      }
  }, [user]);

  // --- RANKING CALCULATION ---
  const rankingData = useMemo(() => {
      if (!user) return { rank: 0, score: 0, total: 0 };
      
      const rankedUsers = users
          .filter(u => u.status !== UserStatus.CHURNED && !u.isTest)
          .map(u => ({ ...u, calculatedScore: calculateEngagementScore(u) }))
          .sort((a, b) => b.calculatedScore - a.calculatedScore);
          
      const rank = rankedUsers.findIndex(u => u.id === user.id) + 1;
      const score = calculateEngagementScore(user);
      
      return { rank, score, total: rankedUsers.length };
  }, [users, user]);

  // --- AI ANALYSIS & STAGNATION CALCULATION ---
  useEffect(() => {
      const runAnalysis = async () => {
          if (activeTab === 'journey' && user && user.journey) {
              setIsAnalyzing(true);
              
              const now = new Date();
              const joinedAt = user.joinedAt ? new Date(user.joinedAt) : new Date();
              
              // 1. Calculate Days Since Last Active (Inactivity - Platform Access)
              let lastActiveDate = joinedAt;
              if (user.lastActive && user.lastActive !== 'Nunca' && user.lastActive !== 'Agora') {
                  // Try parsing ISO first
                  const parsed = new Date(user.lastActive);
                  if (!isNaN(parsed.getTime())) {
                      lastActiveDate = parsed;
                  }
              }
              // Force 0 if 'Agora', otherwise calc diff
              const calcDaysInactive = user.lastActive === 'Agora' ? 0 : Math.max(0, Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 3600 * 24)));
              setDaysInactive(calcDaysInactive);

              // 2. Calculate Days Stagnant in Journey Step (Progress)
              const daysSinceJoined = Math.max(0, Math.floor((now.getTime() - joinedAt.getTime()) / (1000 * 3600 * 24)));
              const completedSteps = user.journey.steps.filter(s => s.isCompleted);
              const nextStep = user.journey.steps.find(s => !s.isCompleted);
              
              let calcDaysStagnant = 0;
              
              if (completedSteps.length > 0) {
                  const lastCompleted = completedSteps[completedSteps.length - 1];
                  // Se completedAt não existir (legado), usa joinedAt como fallback
                  const lastDate = lastCompleted.completedAt ? new Date(lastCompleted.completedAt) : joinedAt;
                  calcDaysStagnant = Math.max(0, Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)));
              } else {
                  // Se não completou nada, o tempo estagnado é o tempo desde que entrou
                  calcDaysStagnant = daysSinceJoined;
              }
              
              setDaysStagnant(calcDaysStagnant);

              const analysis = await analyzeJourney(
                  user.name,
                  daysSinceJoined,
                  nextStep ? nextStep.label : 'Jornada Finalizada',
                  calcDaysStagnant,
                  completedSteps.map(s => s.label)
              );
              
              setAiAnalysis(analysis);
              setIsAnalyzing(false);
          }
      };

      runAnalysis();
  }, [activeTab, user]);

  // --- CHART DATA GENERATION (REALISTIC SIMULATION) ---
  const healthHistory = useMemo(() => {
      if (!user) return [];

      const currentScore = user.healthScore || 0;
      const riskMetric = user.metrics?.risk || 50;
      const engagementMetric = user.metrics?.engagement || 50;
      
      let trendFactor = 0; 
      if (user.status === UserStatus.RISK || user.status === UserStatus.CHURNED) trendFactor = -2.5;
      else if (user.status === UserStatus.NEW) trendFactor = 1.5;
      else if (user.status === UserStatus.ACTIVE) trendFactor = 0.5;

      const journeyCompleted = user.journey?.steps.filter(s => s.isCompleted).length || 0;
      if (journeyCompleted > 2) trendFactor += 0.5;

      const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Hoje'];
      const history = [];

      for (let i = 6; i >= 0; i--) {
          const dayLabel = days[6 - i];
          
          if (i === 0) {
              history.push({ name: dayLabel, value: currentScore });
          } else {
              let basePast = currentScore - (trendFactor * i * 3); 
              const volatility = (100 - riskMetric) / 5; 
              const randomVar = (Math.random() - 0.5) * volatility * i;

              let finalVal = Math.round(basePast + randomVar);
              finalVal = Math.max(0, Math.min(100, finalVal)); // Clamp 0-100

              history.unshift({ name: dayLabel, value: finalVal });
          }
      }
      return history;
  }, [user]);

  const healthTrend = useMemo(() => {
      if (healthHistory.length < 2) return { value: 0, direction: 'neutral' };
      const start = healthHistory[0].value;
      const end = healthHistory[healthHistory.length - 1].value;
      const diff = end - start;
      const percent = start === 0 ? 100 : (diff / start) * 100;
      
      return {
          value: Math.abs(percent).toFixed(1),
          direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
          sign: diff > 0 ? '+' : diff < 0 ? '-' : ''
      };
  }, [healthHistory]);

  const handlePrint = () => {
      window.print();
  };

  if (!user) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-gray-500">
        <p>Usuário não encontrado.</p>
        <button onClick={() => navigate('/users')} className="mt-4 text-neon-cyan hover:underline">
            Voltar para lista
        </button>
      </div>
    );
  }

  const metrics = user.metrics || { engagement: 50, support: 50, finance: 50, risk: 50 };
  const userHistory = user.history || [];

  const journey = user.journey || {
      coreGoal: 'Definir Resultado Chave',
      status: 'not_started',
      steps: [],
      lastUpdate: new Date().toISOString()
  } as SuccessJourney;

  const stepsCompleted = journey.steps.filter(s => s.isCompleted).length;
  const progressPercent = journey.steps.length > 0 ? (stepsCompleted / journey.steps.length) * 100 : 0;

  // --- REFINED ALERT LOGIC ---
  const isRiskStatus = user.status === UserStatus.RISK;
  const isHighInactivity = daysInactive > 10;
  const isJourneyStalled = !isHighInactivity && daysStagnant > 15 && journey.status === 'in_progress';
  const showStagnationAlert = isRiskStatus || isHighInactivity || isJourneyStalled;

  let alertMessage = '';
  let alertTitle = 'Alerta de Estagnação';

  if (isRiskStatus) {
      alertTitle = 'Risco Detectado';
      alertMessage = "Cliente marcado manualmente como 'Risco'. Requer atenção imediata.";
  } else if (isHighInactivity) {
      alertTitle = 'Alerta de Inatividade';
      alertMessage = `Cliente sem acesso à plataforma há ${daysInactive} dias, independente do progresso na jornada.`;
  } else {
      alertTitle = 'Estagnação de Jornada';
      alertMessage = `Este cliente acessa a plataforma, mas não avança na etapa atual há ${daysStagnant} dias.`;
  }

  const isSocialProofCandidate = user.healthScore > 70 && (
      journey.status === 'achieved' || 
      journey.steps.find(s => s.label.includes("Valor Gerado"))?.isCompleted
  );

  const handleToggleStep = async (stepId: string) => {
      const updatedSteps = journey.steps.map(s => {
          if (s.id === stepId) {
              return { 
                  ...s, 
                  isCompleted: !s.isCompleted,
                  completedAt: !s.isCompleted ? new Date().toISOString().split('T')[0] : undefined
              };
          }
          return s;
      });

      const completed = updatedSteps.filter(s => s.isCompleted).length;
      const total = updatedSteps.length;
      let newStatus: 'not_started' | 'in_progress' | 'achieved' = 'in_progress';
      
      if (completed === 0) newStatus = 'not_started';
      
      if (completed === total) {
          newStatus = 'achieved';
          addToast({
              type: 'success',
              title: 'Jornada Concluída!',
              message: 'O cliente atingiu o resultado esperado (North Star).',
              duration: 5000
          });
      }

      const updatedJourney: SuccessJourney = {
          ...journey,
          steps: updatedSteps,
          status: newStatus,
          lastUpdate: new Date().toISOString()
      };

      await updateUser(user.id, { journey: updatedJourney });
  };

  const handleSaveGoal = async () => {
      await updateUser(user.id, { 
          journey: { ...journey, coreGoal: tempGoal } 
      });
      setIsEditingGoal(false);
      addToast({ type: 'success', title: 'Objetivo Atualizado', message: 'O resultado núcleo foi redefinido.' });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
        case 'error': return <AlertTriangle size={16} className="text-red-400" />;
        case 'success': return <CheckCircle size={16} className="text-neon-green" />;
        case 'warning': return <AlertTriangle size={16} className="text-yellow-400" />;
        default: return <Info size={16} className="text-neon-blue" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
        case 'error': return 'border-red-500/30 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
        case 'success': return 'border-neon-green/30 bg-neon-green/10 shadow-[0_0_10px_rgba(52,255,176,0.2)]';
        case 'warning': return 'border-yellow-400/30 bg-yellow-400/10 shadow-[0_0_10px_rgba(250,204,21,0.2)]';
        default: return 'border-neon-blue/30 bg-neon-blue/10 shadow-[0_0_10px_rgba(78,225,255,0.2)]';
    }
  };

  const formatLastActive = (dateStr: string) => {
      if (!dateStr || dateStr === 'Nunca') return 'Nunca';
      if (dateStr === 'Agora') return 'Agora';
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : dateStr;
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto pb-20 print:p-0 print:pb-0">
      
      {/* SCREEN ONLY HEADER */}
      <div className="mb-6 flex justify-between items-center print:hidden">
        <button 
            onClick={() => navigate('/users')} 
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm group"
        >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar para Usuários
        </button>

        <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors shadow-sm"
        >
            <Printer size={16} /> Gerar PDF / Imprimir
        </button>
      </div>

      {/* SCREEN CARD */}
      <Card className="mb-8 p-8 border-white/10 relative overflow-hidden group print:hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl group-hover:bg-neon-cyan/10 transition-all duration-700"></div>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative z-10">
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                    <div className="relative flex h-4 w-4 mt-1" title={`Status: ${user.status}`}>
                        {user.status === 'Ativo' ? (
                            <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-neon-green shadow-[0_0_10px_#34FFB0]"></span>
                            </>
                        ) : (
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-gray-600 border border-white/10"></span>
                        )}
                    </div>

                    <h1 className="text-4xl font-bold font-display text-white tracking-wide">{user.name}</h1>
                    <Badge status={user.status} />
                </div>
                
                <p className="text-xl text-gray-300 font-medium mb-5 pl-8">{user.company}</p>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-gray-400 pl-8">
                    <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default border border-white/5 bg-white/5 px-3 py-1.5 rounded-md">
                        <Mail size={14} className="text-neon-blue" /> {user.email}
                    </span>
                    <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default border border-white/5 bg-white/5 px-3 py-1.5 rounded-md">
                        <Shield size={14} className="text-neon-purple" /> Plano {user.plan}
                    </span>
                    <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default border border-white/5 bg-white/5 px-3 py-1.5 rounded-md">
                        <Clock size={14} className="text-gray-400" /> Visto {formatLastActive(user.lastActive)}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-8 xl:pl-12 xl:border-l xl:border-white/10">
                 <div className="text-right hidden xl:block">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Health Score</p>
                    <p className={`text-base font-medium ${user.healthScore > 70 ? 'text-neon-green' : 'text-yellow-500'}`}>
                        {user.healthScore > 70 ? 'Saúde Excelente' : 'Atenção Necessária'}
                    </p>
                 </div>

                 <div className="relative flex items-center justify-center w-28 h-28">
                     <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                        <circle 
                            cx="50" cy="50" r="42" 
                            stroke={user.healthScore > 70 ? COLORS.green : user.healthScore > 40 ? COLORS.cyan : COLORS.pink} 
                            strokeWidth="6" 
                            fill="none" 
                            strokeLinecap="round"
                            strokeDasharray="264" 
                            strokeDashoffset={264 * (1 - user.healthScore / 100)} 
                            className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                        />
                     </svg>
                     <div className="absolute flex flex-col items-center justify-center">
                         <span className="text-4xl font-bold font-display text-white">{user.healthScore}</span>
                     </div>
                </div>
            </div>
        </div>
      </Card>

      {/* TABS NAVIGATION (SCREEN ONLY) */}
      <div className="flex border-b border-white/10 mb-8 overflow-x-auto scrollbar-hide print:hidden">
        <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'overview' ? 'border-neon-cyan text-neon-cyan' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10'}`}
        >
            <LayoutDashboard size={18} /> Visão Geral
        </button>
        <button 
            onClick={() => setActiveTab('journey')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'journey' ? 'border-neon-cyan text-neon-cyan' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10'}`}
        >
            <Flag size={18} /> Jornada de Sucesso
        </button>
        <button 
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'timeline' ? 'border-neon-cyan text-neon-cyan' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10'}`}
        >
            <History size={18} /> Linha do Tempo
        </button>
      </div>

      {/* --- CONTENT AREA (SCREEN) --- */}
      <div className="min-h-[400px] print:hidden">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                <Card className="col-span-1 md:col-span-2 lg:col-span-8 min-h-[300px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-white">Evolução de Saúde & Sucesso</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${healthTrend.direction === 'up' ? 'bg-neon-green/10 text-neon-green border-neon-green/20' : healthTrend.direction === 'down' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                            {healthTrend.sign}{healthTrend.value}% vs semana anterior
                        </span>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={healthHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOverview" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={healthTrend.direction === 'down' ? COLORS.pink : COLORS.cyan} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={healthTrend.direction === 'down' ? COLORS.pink : COLORS.cyan} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#374151', color: '#fff' }} cursor={{stroke: 'rgba(255,255,255,0.1)'}} formatter={(value: number) => [value, 'Score']} />
                                <Area type="monotone" dataKey="value" stroke={healthTrend.direction === 'down' ? COLORS.pink : COLORS.cyan} strokeWidth={3} fill="url(#colorOverview)" animationDuration={1000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-6">
                    {/* USER RANKING CARD (Replaces Composition) */}
                    <div className={`
                        relative flex flex-col items-center p-6 rounded-2xl border transition-all duration-300 group
                        bg-gradient-to-b from-neon-cyan/20 to-[#0B0F1A] border-neon-cyan/50 shadow-[0_0_40px_rgba(124,252,243,0.15)]
                    `}>
                        {/* Rank Badge */}
                        <div className="absolute -top-4 w-10 h-10 flex items-center justify-center rounded-full font-display font-bold text-lg border-2 bg-neon-cyan text-dark-bg border-white shadow-lg z-20">
                            {rankingData.rank}
                        </div>

                        {rankingData.rank <= 3 && <Crown size={32} className="text-yellow-400 absolute -top-14 animate-bounce z-10" />}

                        {/* Avatar Container */}
                        <div className="relative mb-3 mt-2">
                            <div className="flex items-center justify-center rounded-full border-2 bg-gradient-to-b from-white/10 to-transparent w-20 h-20 border-neon-cyan shadow-[0_0_20px_rgba(124,252,243,0.2)]">
                                <UserIcon size={40} className="text-neon-cyan" />
                            </div>
                            
                            {user.status === 'Ativo' && <div className="absolute bottom-0 right-0 w-4 h-4 bg-neon-green border-2 border-dark-bg rounded-full shadow-[0_0_5px_#34FFB0]"></div>}
                        </div>

                        <h3 className="font-bold text-white text-center line-clamp-1 text-lg">{user.name}</h3>
                        <p className="text-xs text-gray-400 mb-4">{user.company}</p>

                        {(() => {
                            const badge = getStageBadge(user);
                            const BadgeIcon = badge.icon;
                            return (
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border mb-4 ${badge.color}`}>
                                    <BadgeIcon size={12} /> {badge.label}
                                </div>
                            );
                        })()}

                        <div className="mt-auto flex flex-col items-center">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Engagement Score</span>
                            <span className="font-display font-bold text-4xl text-neon-cyan drop-shadow-[0_0_10px_rgba(124,252,243,0.5)]">
                                {rankingData.score}
                            </span>
                        </div>
                    </div>

                    <Card className={`border ${user.healthScore < 40 ? 'border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent' : 'border-neon-cyan/20 bg-gradient-to-br from-neon-cyan/5 to-transparent'}`}>
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg shrink-0 ${user.healthScore < 40 ? 'bg-red-500/20 text-red-400' : 'bg-neon-cyan/20 text-neon-cyan'}`}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold mb-1 ${user.healthScore < 40 ? 'text-red-400' : 'text-neon-cyan'}`}>
                                    {user.healthScore < 40 ? 'Análise de Risco: Crítico' : 'Análise de Risco: Estável'}
                                </p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {user.healthScore < 40 
                                        ? "O score de saúde caiu drasticamente. O engajamento ou risco financeiro está puxando a média para baixo. Verifique os tickets de suporte." 
                                        : `O engajamento é ${metrics.engagement > 70 ? 'alto' : 'moderado'} e a jornada está ${journey.status === 'in_progress' ? 'evoluindo' : 'estável'}. Mantenha o acompanhamento.`}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </motion.div>
          )}

          {activeTab === 'journey' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="max-w-5xl mx-auto">
                  
                  {/* ... Smart Alerts (Screen Only) ... */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {showStagnationAlert && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                              <div className="p-2 bg-red-500/20 rounded-lg text-red-400 shrink-0">
                                  <Timer size={20} />
                              </div>
                              <div>
                                  <h4 className="text-sm font-bold text-red-400 uppercase tracking-wide flex items-center gap-2">
                                      {alertTitle}
                                  </h4>
                                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                                      {alertMessage}
                                      <br/>Recomendamos intervenção manual (Call/Email).
                                  </p>
                              </div>
                          </motion.div>
                      )}

                      {isSocialProofCandidate && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-neon-purple/10 to-neon-blue/5 border border-neon-purple/30 p-4 rounded-xl flex items-start gap-3 shadow-[0_0_15px_rgba(155,92,255,0.1)]">
                              <div className="p-2 bg-neon-purple/20 rounded-lg text-neon-purple shrink-0">
                                  <Award size={20} />
                              </div>
                              <div>
                                  <h4 className="text-sm font-bold text-neon-purple uppercase tracking-wide flex items-center gap-2">
                                      Radar de Prova Social <Sparkles size={12} />
                                  </h4>
                                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                                      Alta saúde e valor gerado confirmados.
                                      <br/>Momento ideal para solicitar <strong>depoimento ou Case de Sucesso</strong>.
                                  </p>
                              </div>
                          </motion.div>
                      )}
                  </div>

                  <Card className="p-0 overflow-hidden border-neon-cyan/20">
                      <div className="relative p-8 bg-gradient-to-r from-neon-cyan/10 to-transparent border-b border-white/10">
                          <div className="absolute top-4 right-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${journey.status === 'achieved' ? 'bg-neon-green/20 text-neon-green border-neon-green/30' : journey.status === 'in_progress' ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/30' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                                  {journey.status === 'achieved' ? 'Resultado Atingido' : journey.status === 'in_progress' ? 'Em Progresso' : 'Não Iniciado'}
                              </span>
                          </div>
                          <h3 className="text-xs font-bold text-neon-cyan uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Target size={16} /> Resultado Núcleo do Cliente
                          </h3>
                          {isEditingGoal ? (
                              <div className="flex gap-2 max-w-xl mt-2">
                                  <input type="text" value={tempGoal} onChange={(e) => setTempGoal(e.target.value)} className="flex-1 bg-black/30 border border-neon-cyan/50 rounded-lg px-4 py-2 text-xl font-display font-bold text-white focus:outline-none" autoFocus />
                                  <button onClick={handleSaveGoal} className="px-4 py-2 bg-neon-cyan text-dark-bg font-bold rounded-lg hover:bg-neon-blue transition-colors">Salvar</button>
                              </div>
                          ) : (
                              <div className="flex items-center gap-3 mt-2 group cursor-pointer" onClick={() => setIsEditingGoal(true)}>
                                  <h2 className="text-2xl font-display font-bold text-white">{journey.coreGoal}</h2>
                                  <Edit2 size={16} className="text-gray-600 group-hover:text-neon-cyan transition-colors" />
                              </div>
                          )}
                          <p className="text-sm text-gray-400 mt-2 max-w-2xl">
                              Este é o valor final que o produto promete entregar. Todos os passos abaixo são meios para este fim.
                          </p>
                      </div>

                      <div className="h-1.5 w-full bg-black">
                          <div className={`h-full shadow-[0_0_10px_rgba(124,252,243,0.5)] transition-all duration-1000 ease-out ${journey.status === 'achieved' ? 'bg-neon-green' : 'bg-neon-cyan'}`} style={{ width: `${progressPercent}%` }}></div>
                      </div>

                      <div className="grid grid-cols-12">
                          <div className="col-span-12 lg:col-span-8 p-8 border-r border-white/5">
                              <h4 className="text-sm font-bold text-white mb-6">Plano de Ação</h4>
                              <div className="space-y-4">
                                  {journey.steps.map((step) => (
                                      <div key={step.id} className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${step.isCompleted ? 'bg-neon-green/[0.03] border-neon-green/20' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                                          <button onClick={() => handleToggleStep(step.id)} className={`mt-1 w-6 h-6 rounded border flex items-center justify-center transition-all shrink-0 ${step.isCompleted ? 'bg-neon-green border-neon-green text-dark-bg shadow-[0_0_10px_rgba(52,255,176,0.3)]' : 'bg-transparent border-gray-600 hover:border-white'}`}>
                                              {step.isCompleted && <CheckSquare size={14} strokeWidth={3} />}
                                          </button>
                                          <div className="flex-1">
                                              <div className="flex justify-between items-start">
                                                  <h5 className={`font-bold text-base ${step.isCompleted ? 'text-white line-through decoration-neon-green/50 decoration-2' : 'text-gray-200'}`}>{step.label}</h5>
                                                  {step.isCompleted && step.completedAt && (
                                                      <span className="text-xs text-neon-green font-mono flex items-center gap-1"><Award size={12} /> {new Date(step.completedAt).toLocaleDateString()}</span>
                                                  )}
                                              </div>
                                              <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="col-span-12 lg:col-span-4 p-8 bg-white/[0.01]">
                              <div className="flex items-center gap-2 mb-6">
                                  <BrainCircuit size={18} className="text-neon-purple" />
                                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Diagnóstico de IA</h4>
                              </div>
                              
                              <div className="p-5 rounded-xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 relative overflow-hidden">
                                  {isAnalyzing ? (
                                      <div className="flex flex-col items-center justify-center py-8 text-center">
                                          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mb-3"></div>
                                          <p className="text-xs text-neon-cyan animate-pulse">Analisando padrão temporal...</p>
                                      </div>
                                  ) : (
                                      <>
                                          <div className="absolute top-0 right-0 p-3 opacity-20 text-neon-purple"><Bot size={48} /></div>
                                          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line font-medium relative z-10">
                                              {aiAnalysis || "Aguardando dados suficientes para diagnóstico..."}
                                          </p>
                                          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] text-gray-500">
                                              <Sparkles size={10} className="text-neon-purple" />
                                              Análise baseada no tempo de estagnação por etapa.
                                          </div>
                                      </>
                                  )}
                              </div>

                              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5">
                                  <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                                      <ChevronRight size={14} className="text-neon-cyan"/> Próximo Passo Recomendado
                                  </h5>
                                  <p className="text-sm text-gray-300">
                                      {journey.steps.find(s => !s.isCompleted)?.description || "Monitorar consistência e oferecer upsell."}
                                  </p>
                              </div>
                          </div>
                      </div>
                  </Card>
              </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto">
                <div className="relative pl-6">
                    <div className="absolute left-[3rem] top-4 bottom-8 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent -translate-x-1/2"></div>
                    <div className="space-y-6">
                        {userHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-sm">Nenhum evento registrado ainda.</p>
                            </div>
                        ) : (
                            userHistory.map((event) => (
                                <div key={event.id} className="relative flex items-start gap-6 group">
                                    <div className={`relative z-10 w-12 h-12 rounded-xl border border-white/10 bg-[#0B0F1A] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:border-white/30 ${getEventColor(event.type).replace('bg-', 'text-').split(' ')[0]}`}>
                                        {getEventIcon(event.type)}
                                    </div>
                                    <Card className="flex-1 py-5 px-6 hover:bg-white/[0.04] transition-colors border-white/5 hover:border-white/20">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                                            <p className="font-semibold text-white text-base">{event.title}</p>
                                            <span className="text-xs text-gray-500 font-mono px-2 py-1 bg-white/5 rounded border border-white/5 whitespace-nowrap">{event.timestamp}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed">{event.description}</p>
                                    </Card>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
          )}
      </div>

      {/* --- PRINT ONLY LAYOUT (High Contrast, Full Data) --- */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 overflow-y-auto text-black">
          <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-8">
                  <div>
                      <h1 className="text-3xl font-bold font-display text-black uppercase tracking-wider">Relatório de Cliente</h1>
                      <p className="text-sm text-gray-600 mt-1">Gerado em {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                      <h2 className="text-xl font-bold text-black">{user.name}</h2>
                      <p className="text-sm text-gray-600">{user.company}</p>
                  </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8 border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Status</p>
                      <p className="text-lg font-bold">{user.status}</p>
                  </div>
                  <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Plano</p>
                      <p className="text-lg font-bold">{user.plan}</p>
                  </div>
                  <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Health Score</p>
                      <p className="text-lg font-bold">{user.healthScore}/100</p>
                  </div>
                  <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Receita (MRR)</p>
                      <p className="text-lg font-bold">R$ {user.mrr.toLocaleString()}</p>
                  </div>
                  <div className="col-span-4 border-t border-gray-200 mt-2 pt-2 flex gap-6 text-sm text-gray-600">
                      <span><span className="font-bold">Email:</span> {user.email}</span>
                      <span><span className="font-bold">Entrada:</span> {new Date(user.joinedAt).toLocaleDateString()}</span>
                      <span><span className="font-bold">Último Acesso:</span> {formatLastActive(user.lastActive)}</span>
                  </div>
              </div>

              {/* Metrics */}
              <h3 className="text-lg font-bold border-b border-black pb-2 mb-4">Métricas de Saúde</h3>
              <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="border rounded p-3 text-center">
                      <p className="text-xs uppercase text-gray-500">Engajamento</p>
                      <p className="text-xl font-bold">{metrics.engagement}</p>
                  </div>
                  <div className="border rounded p-3 text-center">
                      <p className="text-xs uppercase text-gray-500">Suporte</p>
                      <p className="text-xl font-bold">{metrics.support}</p>
                  </div>
                  <div className="border rounded p-3 text-center">
                      <p className="text-xs uppercase text-gray-500">Financeiro</p>
                      <p className="text-xl font-bold">{metrics.finance}</p>
                  </div>
                  <div className="border rounded p-3 text-center">
                      <p className="text-xs uppercase text-gray-500">Risco</p>
                      <p className="text-xl font-bold">{metrics.risk}</p>
                  </div>
              </div>

              {/* Journey Details */}
              <h3 className="text-lg font-bold border-b border-black pb-2 mb-4">Jornada de Sucesso</h3>
              <div className="mb-8">
                  <div className="bg-gray-100 p-4 rounded mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase">Objetivo Principal (North Star)</p>
                      <p className="text-lg font-bold">{journey.coreGoal}</p>
                  </div>
                  
                  <div className="space-y-0 border border-gray-300 rounded">
                      {journey.steps.map((step, idx) => (
                          <div key={step.id} className={`flex items-start p-4 ${idx !== journey.steps.length - 1 ? 'border-b border-gray-200' : ''}`}>
                              <div className={`mt-1 w-5 h-5 border-2 rounded flex items-center justify-center mr-4 ${step.isCompleted ? 'border-black bg-black text-white' : 'border-gray-300'}`}>
                                  {step.isCompleted && <CheckSquare size={12} />}
                              </div>
                              <div className="flex-1">
                                  <div className="flex justify-between">
                                      <span className={`font-bold ${step.isCompleted ? 'text-black' : 'text-gray-500'}`}>{step.label}</span>
                                      {step.isCompleted && step.completedAt && (
                                          <span className="text-xs font-mono text-gray-600 border border-gray-300 px-2 py-0.5 rounded bg-gray-50">
                                              {new Date(step.completedAt).toLocaleDateString()}
                                          </span>
                                      )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Recent History */}
              {userHistory.length > 0 && (
                  <>
                    <h3 className="text-lg font-bold border-b border-black pb-2 mb-4">Histórico Recente (Últimos 5 Eventos)</h3>
                    <table className="w-full text-left text-sm border-collapse border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 border border-gray-300">Data</th>
                                <th className="p-2 border border-gray-300">Tipo</th>
                                <th className="p-2 border border-gray-300">Evento</th>
                                <th className="p-2 border border-gray-300">Descrição</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userHistory.slice(0, 5).map((ev) => (
                                <tr key={ev.id}>
                                    <td className="p-2 border border-gray-300 font-mono text-xs">{ev.timestamp}</td>
                                    <td className="p-2 border border-gray-300 uppercase text-xs font-bold">{ev.type}</td>
                                    <td className="p-2 border border-gray-300 font-semibold">{ev.title}</td>
                                    <td className="p-2 border border-gray-300 text-gray-600">{ev.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </>
              )}

              {/* Footer */}
              <div className="mt-12 text-center text-xs text-gray-400 border-t pt-4">
                  Relatório gerado automaticamente pelo sistema NEONDASH.
              </div>
          </div>
      </div>
    </div>
  );
};

export default UserProfile;