import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HealthScore from '../components/Dashboard/HealthScore';
import MetricCard from '../components/Dashboard/MetricCard';
// import AIStrip from '../components/Dashboard/AIStrip'; // Removed import
import Card from '../components/ui/Card';
import PageTransition from '../components/ui/PageTransition';
import { COLORS } from '../constants';
import { UserStatus } from '../types';
import { useUserStore } from '../store/useUserStore';
import { useTimeframeStore } from '../store/useTimeframeStore';
import { fetchDashboardMetrics } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users as UsersIcon, Activity, AlertTriangle, Zap, Server, Pause, Play, Trash2, CheckCircle, Flag, Target, ArrowRight, AlertCircle, Lightbulb, TrendingUp, Gem } from 'lucide-react';
import { useEventStream } from '../hooks/useEventStream';
// RetentionChart removed from Dashboard to keep only in Retention page

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'focus'>('overview');
  const navigate = useNavigate();
  
  // Real-time Event Stream Hook
  const { events, isPaused, setIsPaused, clearResolved } = useEventStream();
  
  // Connect to store to get dynamic users
  const { users, fetchUsers, isLoading: isUsersLoading } = useUserStore();
  
  // Fetch users from Supabase on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- KPI CALCULATIONS ---
  // Total Users: Considerar estritamente: Ativos, Novos, Risco e Fantasma (Exclui Cancelados)
  const totalUsers = users.filter(u => 
      u.status === UserStatus.ACTIVE || 
      u.status === UserStatus.NEW || 
      u.status === UserStatus.RISK || 
      u.status === UserStatus.GHOST
  ).length;

  // Financial & Health Metrics: Exclude Test Users to avoid skewing business data
  const revenueUsers = users.filter(u => !u.isTest);

  // --- JOURNEY FRICTION LOGIC (UPDATED RULES) ---
  const frictionStats = useMemo(() => {
      const activeBase = users.filter(u => u.status !== UserStatus.CHURNED);
      const total = activeBase.length || 1;
      
      let countActivation = 0;
      let countMethod = 0;
      let countExecution = 0;
      let countValue = 0;

      activeBase.forEach(u => {
          const steps = u.journey?.steps || [];
          // IDs baseados no template: 1=Ativação, 2=Método, 3=Execução, 4=Valor, 5=Upsell
          const s1 = steps.find(s => s.id === '1')?.isCompleted;
          const s2 = steps.find(s => s.id === '2')?.isCompleted;
          const s3 = steps.find(s => s.id === '3')?.isCompleted;
          const s4 = steps.find(s => s.id === '4')?.isCompleted;

          // REGRAS DE NEGÓCIO ATUALIZADAS:
          
          // 1. Card Ativação: Usuários que AINDA NÃO ativaram (Passo 1 Pendente)
          if (!s1) {
              countActivation++;
          }
          // 2. Card Método: Considerar quando "Estruturação do Método" (Passo 2) estiver MARCADO
          // (E ainda não marcou execução, para não duplicar)
          else if (s2 && !s3) {
              countMethod++;
          }
          // 3. Card Execução: Considerar quando "Execução Assistida" (Passo 3) estiver MARCADO
          // (E ainda não marcou valor)
          else if (s3 && !s4) {
              countExecution++;
          }
          // 4. Card Valor: Considerar quando "Valor Gerado" (Passo 4) estiver MARCADO
          else if (s4) {
              countValue++;
          }
          // Nota: Usuários que tem S1(Ativação) mas NÃO S2(Método) não caem em nenhum card principal
          // pois a regra do Método exige estar MARCADO. Eles são o "Gap" de setup.
      });

      return [
          { 
              id: 'activation', 
              label: 'Ativação', 
              insight: 'Pré-Ativação', 
              desc: 'Usuários que ainda não concluíram o onboarding inicial.',
              count: countActivation, 
              percent: (countActivation / total) * 100,
              color: 'text-red-400', 
              icon: AlertCircle,
              // Estilos Neon/Mission
              containerClass: 'bg-gradient-to-br from-red-500/10 to-transparent border-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
              accentClass: 'bg-red-500',
              barClass: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
          },
          { 
              id: 'method', 
              label: 'Método', 
              insight: 'Método Estruturado', 
              desc: 'Setup metodológico concluído. Preparando execução.',
              count: countMethod, 
              percent: (countMethod / total) * 100,
              color: 'text-orange-400', 
              icon: CheckCircle,
              // Estilos Neon/Mission
              containerClass: 'bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30 hover:border-orange-500/60 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]',
              accentClass: 'bg-orange-500',
              barClass: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]'
          },
          { 
              id: 'execution', 
              label: 'Execução', 
              insight: 'Execução Assistida', 
              desc: 'Em operação com suporte. Rumo ao primeiro valor.',
              count: countExecution, 
              percent: (countExecution / total) * 100,
              color: 'text-blue-400', 
              icon: Zap,
              // Estilos Neon/Mission
              containerClass: 'bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/30 hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
              accentClass: 'bg-blue-500',
              barClass: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]'
          },
          { 
              id: 'value', 
              label: 'Valor & Upsell', 
              insight: 'Valor Gerado', 
              desc: 'Sucesso comprovado. Candidatos a expansão.',
              count: countValue, 
              percent: (countValue / total) * 100,
              color: 'text-neon-green', 
              icon: Gem,
              special: true,
              // Estilos Neon/Mission
              containerClass: 'bg-gradient-to-br from-neon-green/10 to-transparent border-neon-green/30 hover:border-neon-green/60 hover:shadow-[0_0_25px_rgba(52,255,176,0.2)]',
              accentClass: 'bg-neon-green',
              barClass: 'bg-neon-green shadow-[0_0_15px_rgba(52,255,176,0.8)]'
          }
      ];
  }, [users]);

  const journeyStats = useMemo(() => {
      const activeBase = users.filter(u => u.status !== UserStatus.CHURNED);
      const total = activeBase.length || 1;
      
      const achieved = activeBase.filter(u => u.journey?.status === 'achieved').length;
      const inProgress = activeBase.filter(u => u.journey?.status === 'in_progress').length;
      const notStarted = activeBase.filter(u => !u.journey || u.journey.status === 'not_started').length;

      return {
          achieved: { count: achieved, percent: (achieved/total)*100 },
          inProgress: { count: inProgress, percent: (inProgress/total)*100 },
          notStarted: { count: notStarted, percent: (notStarted/total)*100 }
      };
  }, [users]);

  // Calculate MRR (exclude churned users from revenue base)
  const totalMRR = revenueUsers.reduce((acc, user) => acc + (user.status !== UserStatus.CHURNED ? user.mrr : 0), 0);
  
  // Calculate Churn Rate (Churned / Total Revenue Users)
  const churnedCount = revenueUsers.filter(u => u.status === UserStatus.CHURNED).length;
  const churnRate = revenueUsers.length > 0 ? (churnedCount / revenueUsers.length) * 100 : 0;
  
  // Calculate Avg Health (Revenue Users only)
  const totalScore = revenueUsers.reduce((acc, user) => acc + (user.healthScore || 0), 0);
  const globalScore = revenueUsers.length > 0 ? Math.round(totalScore / revenueUsers.length) : 0;
  
  // Get global timeframe
  const { timeframe } = useTimeframeStore();

  // Fetch chart history - PASSING REAL DATA TO MOCK GENERATOR
  const { data, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['dashboardMetrics', timeframe, totalUsers, totalMRR, churnRate], // Refetch when data changes
    queryFn: () => fetchDashboardMetrics(timeframe, {
        users: totalUsers, // Visual chart includes all non-churned users
        mrr: totalMRR,     // Financial chart excludes test users
        churn: churnRate,  // Retention chart excludes test users
        health: globalScore
    }),
    refetchInterval: 30000, 
  });

  // --- REAL-TIME STREAM ANALYTICS ---
  const streamAnalytics = useMemo(() => {
      const critical = events.filter(e => e.level === 'critical').length;
      const warning = events.filter(e => e.level === 'warning').length;
      
      // Calculate Top Sources for Errors/Warnings
      const sourceCounts: Record<string, number> = {};
      events.forEach(e => {
          if (e.level === 'critical' || e.level === 'warning') {
              sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
          }
      });

      const topSources = Object.entries(sourceCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([name, count], _, arr) => ({
              name,
              count,
              percent: (count / (arr[0]?.[1] || 1)) * 100 // Relative to biggest bar
          }));

      return { critical, warning, topSources };
  }, [events]);

  const isLoading = isUsersLoading || isMetricsLoading;

  return (
    <PageTransition className="flex flex-col gap-6 p-8 max-w-[1600px] mx-auto pb-12">
      <div className="flex justify-between items-end mb-2">
        <div>
            <h1 className="text-3xl font-bold font-display text-white">Mission Control</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                Visão geral da plataforma
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-neon-cyan border border-neon-cyan/20">
                    {timeframe.toUpperCase()}
                </span>
            </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex p-1 bg-white/5 rounded-lg border border-white/10 scale-90 origin-right">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-neon-blue/20 text-neon-blue shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
                Visão Geral
            </button>
            <button 
                onClick={() => setActiveTab('focus')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'focus' ? 'bg-red-500/20 text-red-400 shadow-sm border border-red-500/10' : 'text-gray-400 hover:text-white'}`}
            >
                {activeTab === 'focus' && <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>}
                Modo Foco: Crítico
            </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        /* --- OVERVIEW TAB CONTENT --- */
        <motion.div 
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
            
            {/* Main Metrics (Top Row) */}
            <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    title="Total de Usuários"
                    value={totalUsers}
                    subValue={data?.activeUsers.trend ? `${data.activeUsers.trend > 0 ? '+' : ''}${data.activeUsers.trend.toFixed(3)}% vs média` : "0.0% vs média"}
                    subColor={data?.activeUsers.trend && data.activeUsers.trend > 0 ? "text-neon-green" : "text-gray-500"}
                    chartData={data?.activeUsers.history || []}
                    chartColor={COLORS.blue}
                    isLoading={isLoading}
                    icon={<div className="relative"><span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span></span><UsersIcon size={20} /></div>}
                    onClick={() => navigate('/users')}
                />
                <MetricCard 
                    title="RRC (MRR)"
                    value={`R$ ${(totalMRR / 1000).toFixed(1)}k`}
                    subValue={data?.mrr.trend ? `${data.mrr.trend > 0 ? '+' : ''}${data.mrr.trend.toFixed(1)}%` : "0.0%"}
                    subColor={data?.mrr.trend && data.mrr.trend > 0 ? "text-neon-green" : "text-gray-500"}
                    chartData={data?.mrr.history || []}
                    chartColor={COLORS.purple}
                    isLoading={isLoading}
                    icon={<DollarSign size={20} />}
                    onClick={() => navigate('/billing')}
                />
                <MetricCard 
                    title="Taxa de Churn"
                    value={`${churnRate.toFixed(1)}%`}
                    subValue={data?.churn.trend ? `${data.churn.trend > 0 ? '+' : ''}${data.churn.trend.toFixed(1)}% vs anterior` : "0.0%"}
                    subColor={data?.churn.trend && data.churn.trend > 0 ? "text-red-400" : "text-neon-green"}
                    chartData={data?.churn.history || []}
                    chartColor={COLORS.pink} 
                    isLoading={isLoading}
                    icon={<Activity size={20} />}
                    onClick={() => navigate('/retention')}
                />
            </div>

            {/* Health Score Right Side */}
            <div className="col-span-1 flex justify-center w-full h-full min-h-[300px]">
                <HealthScore onClick={() => navigate('/health')} />
            </div>

            {/* --- BOTTOM ROW --- */}
            {/* Journey Distribution (Left) */}
            <Card className="col-span-1 md:col-span-1 border-neon-cyan/20 bg-gradient-to-br from-neon-cyan/5 to-transparent flex flex-col justify-center p-6 gap-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Target size={20} className="text-neon-cyan" /> Sucesso do Cliente
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Status global.</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Achieved */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-white font-medium">Resultado Atingido</span>
                            <span className="text-neon-green font-bold text-base">{journeyStats.achieved.count}</span>
                        </div>
                        <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-neon-green shadow-[0_0_10px_rgba(52,255,176,0.5)] transition-all duration-1000" style={{ width: `${journeyStats.achieved.percent}%` }}></div>
                        </div>
                    </div>

                    {/* In Progress */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300">Em Progresso</span>
                            <span className="text-neon-blue font-bold text-base">{journeyStats.inProgress.count}</span>
                        </div>
                        <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-neon-blue transition-all duration-1000" style={{ width: `${journeyStats.inProgress.percent}%` }}></div>
                        </div>
                    </div>

                    {/* Not Started */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Setup</span>
                            <span className="text-gray-400 font-bold text-base">{journeyStats.notStarted.count}</span>
                        </div>
                        <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-600 transition-all duration-1000" style={{ width: `${journeyStats.notStarted.percent}%` }}></div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* --- NEW: DIAGNÓSTICO DE FRICÇÃO (UPDATED CARD STYLE) --- */}
            <div className="col-span-1 md:col-span-3">
                <Card className="h-full flex flex-col justify-center border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white/5 rounded-lg text-white">
                            <Lightbulb size={20} className="text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Funil de Fricção & Oportunidade</h3>
                            <p className="text-xs text-gray-500">Distribuição da base por etapa <span className="text-white font-bold">concluída (marcada)</span>.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {frictionStats.map((stat, idx) => (
                            <div key={stat.id} className="relative flex flex-col group">
                                {/* Connector Line */}
                                {idx < frictionStats.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-6 w-8 h-0.5 bg-white/10 -translate-y-1/2 z-0">
                                        <div className="absolute right-0 -top-1 text-white/10"><ArrowRight size={12} /></div>
                                    </div>
                                )}

                                <div className={`
                                    relative z-10 p-5 rounded-xl border transition-all duration-300 h-full flex flex-col justify-between overflow-hidden cursor-pointer
                                    ${stat.containerClass}
                                `}>
                                    {/* Accent Side Bar */}
                                    <div className={`absolute top-0 left-0 w-1 h-full ${stat.accentClass} opacity-80`}></div>

                                    <div>
                                        <div className="flex justify-between items-start mb-2 pl-2">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${stat.color}`}>{stat.label}</span>
                                            {/* Icon Logic */}
                                            <stat.icon size={16} className={stat.color} />
                                        </div>
                                        
                                        {stat.special && stat.count > 0 && (
                                            <div className="mb-2 ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neon-green text-dark-bg text-[10px] font-bold uppercase tracking-wide animate-pulse">
                                                <TrendingUp size={10} /> Oportunidade Upsell
                                            </div>
                                        )}

                                        <p className="text-sm font-bold text-white mb-1 flex items-center gap-2 pl-2">
                                            {stat.insight}
                                        </p>
                                        <p className="text-[10px] text-gray-400 leading-tight mb-4 pl-2 opacity-80">{stat.desc}</p>
                                    </div>

                                    <div className="pl-2">
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-3xl font-display font-bold text-white">{stat.count}</span>
                                            <span className="text-xs text-gray-500 mb-1">usuários</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                            <div 
                                                className={`h-full ${stat.barClass} transition-all duration-1000`} 
                                                style={{ width: `${Math.max(5, stat.percent)}%` }} // Min 5% visual
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

        </motion.div>
      ) : (
        /* --- FOCUS MODE TAB CONTENT --- */
        <motion.div 
            key="focus"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8"
        >
            {/* ... Focus Content (Same as before) ... */}
            <div className="w-full">
                <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Stream em Tempo Real
                        </h3>
                        <div className="flex gap-2">
                            <button 
                            onClick={() => setIsPaused(!isPaused)}
                            className={`flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3 py-1 bg-white/5 rounded border border-transparent hover:border-white/10 transition-all ${isPaused ? 'bg-yellow-500/10 text-yellow-500' : ''}`}
                            >
                            {isPaused ? <Play size={12} /> : <Pause size={12} />}
                            {isPaused ? 'Retomar' : 'Pausar'}
                            </button>
                            <button 
                            onClick={clearResolved}
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 px-3 py-1 bg-white/5 rounded border border-transparent hover:border-white/10 transition-all"
                            >
                            <Trash2 size={12} /> Limpar
                            </button>
                        </div>
                </div>

                <div className="relative min-h-[500px] max-h-[600px] overflow-y-auto scrollbar-hide bg-white/[0.01] rounded-xl border border-white/5 p-4">
                    {events.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500 opacity-60">
                            <Activity size={48} className="mb-4" />
                            <p>Aguardando eventos do sistema...</p>
                        </div>
                    )}
                    <AnimatePresence initial={false}>
                        {events.map((event) => {
                            const isCritical = event.level === 'critical';
                            const isWarning = event.level === 'warning';
                            const isSuccess = event.level === 'success';
                            
                            return (
                                <motion.div 
                                    key={event.id}
                                    layout
                                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3 }}
                                    className={`
                                        group flex flex-col md:flex-row items-start md:items-center gap-4 p-5 rounded-xl border backdrop-blur-md mb-3
                                        ${isCritical 
                                            ? 'bg-red-500/[0.03] border-red-500/20 hover:bg-red-500/[0.06]' 
                                            : isWarning
                                                ? 'bg-yellow-500/[0.03] border-yellow-500/20 hover:bg-yellow-500/[0.06]'
                                                : isSuccess 
                                                    ? 'bg-neon-green/[0.03] border-neon-green/20 hover:bg-neon-green/[0.06]'
                                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                        }
                                    `}
                                >
                                    <div className={`
                                        p-3 rounded-lg shrink-0
                                        ${isCritical ? 'bg-red-500/10 text-red-500' : isWarning ? 'bg-yellow-500/10 text-yellow-500' : isSuccess ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-blue/10 text-neon-blue'}
                                    `}>
                                        {isCritical ? <AlertTriangle size={24} /> : isWarning ? <Zap size={24} /> : isSuccess ? <CheckCircle size={24} /> : <Server size={24} />}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className={`font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-yellow-400' : isSuccess ? 'text-neon-green' : 'text-white'}`}>
                                                {event.title}
                                            </h4>
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-gray-400 border border-white/5 uppercase">
                                                {event.source}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>
                                        <p className="text-xs text-gray-500 mt-2 font-mono flex items-center gap-2">
                                            {event.timestamp} • ID: #{event.id.slice(-6)}
                                        </p>
                                    </div>

                                    <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                                        {event.action && (
                                            <button className={`
                                                px-4 py-2 text-xs font-bold uppercase tracking-wider rounded border transition-colors
                                                ${isCritical 
                                                    ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' 
                                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}
                                            `}>
                                                {event.action}
                                            </button>
                                        )}
                                        <button className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded border border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5">
                                            Ignorar
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-red-500/30 bg-red-500/5 hover:border-red-500/50 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded bg-red-500/20 text-red-500"><AlertTriangle size={20} /></div>
                                <span className="text-sm font-bold text-red-400 uppercase">Críticos</span>
                        </div>
                        <p className="text-4xl font-display font-bold text-white mt-4">{streamAnalytics.critical}</p>
                        <p className="text-xs text-red-300 mt-1">Requerem ação imediata</p>
                    </Card>

                    <Card className="border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded bg-yellow-500/20 text-yellow-500"><Activity size={20} /></div>
                                <span className="text-sm font-bold text-yellow-500 uppercase">Avisos</span>
                        </div>
                        <p className="text-4xl font-display font-bold text-white mt-4">{streamAnalytics.warning}</p>
                        <p className="text-xs text-yellow-300 mt-1">Monitorar de perto</p>
                    </Card>
                    
                    <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02]">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Fontes de Erro (Top 3)</h3>
                        <div className="space-y-4">
                            {streamAnalytics.topSources.length === 0 ? (
                                <div className="text-center text-gray-500 py-4 text-xs">
                                    Nenhum erro recente detectado.
                                </div>
                            ) : (
                                streamAnalytics.topSources.map((source, idx) => (
                                    <div key={source.name}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-300">{source.name}</span> 
                                            <span className={`${idx === 0 ? 'text-red-400' : 'text-gray-400'} font-mono`}>{source.count}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full">
                                            <div 
                                                className={`h-full rounded-full ${idx === 0 ? 'bg-red-500/50' : idx === 1 ? 'bg-yellow-500/50' : 'bg-blue-500/50'}`} 
                                                style={{ width: `${source.percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
            </div>
        </motion.div>
      )}
    </PageTransition>
  );
};

export default Dashboard;