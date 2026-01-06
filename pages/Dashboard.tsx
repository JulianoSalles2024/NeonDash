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
import { DollarSign, Users as UsersIcon, Activity, AlertTriangle, Zap, Server, Pause, Play, Trash2, CheckCircle, Flag, Target } from 'lucide-react';
import { useEventStream } from '../hooks/useEventStream';
import RetentionEvolutionChart from '../components/Charts/RetentionEvolutionChart';

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
  // Total Users: Exclude ONLY Churned users (Keep Active, Risk, New, Ghost)
  const totalUsers = users.filter(u => u.status !== UserStatus.CHURNED).length;

  // Financial & Health Metrics: Exclude Test Users to avoid skewing business data
  const revenueUsers = users.filter(u => !u.isTest);

  // Journey Status Stats
  const journeyStats = useMemo(() => {
      const activeBase = users.filter(u => !u.isTest && u.status !== UserStatus.CHURNED);
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
    <PageTransition className="flex flex-col gap-6 p-8 max-w-[1600px] mx-auto pb-20">
      <div className="flex justify-between items-end mb-2">
        <div>
            <h1 className="text-3xl font-bold font-display text-white">Mission Control</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                Visão geral da plataforma
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-neon-cyan border border-neon-cyan/20">
                    {timeframe.toUpperCase()}
                </span>
            </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex p-1 bg-white/5 rounded-lg border border-white/10">
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

      {/* AIStrip removed here */}

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
                    icon={<div className="relative"><span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span></span><UsersIcon size={18} /></div>}
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
                    icon={<DollarSign size={18} />}
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
                    icon={<Activity size={18} />}
                    onClick={() => navigate('/retention')}
                />
            </div>

            {/* Health Score Right Side */}
            <div className="col-span-1 flex justify-center w-full">
                <HealthScore onClick={() => navigate('/health')} />
            </div>

            {/* --- NEW SECTION: JOURNEY DISTRIBUTION (Aggregated Panel) --- */}
            <Card className="col-span-1 md:col-span-2 border-neon-cyan/20 bg-gradient-to-br from-neon-cyan/5 to-transparent">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Target size={18} className="text-neon-cyan" /> Sucesso do Cliente
                        </h3>
                        <p className="text-xs text-gray-400">Distribuição da base por etapa da Jornada de Valor.</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg text-neon-cyan">
                        <Flag size={20} />
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Achieved */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-white font-medium">Resultado Atingido (Success)</span>
                            <span className="text-neon-green font-bold">{journeyStats.achieved.count}</span>
                        </div>
                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-neon-green shadow-[0_0_10px_rgba(52,255,176,0.5)]" style={{ width: `${journeyStats.achieved.percent}%` }}></div>
                        </div>
                    </div>

                    {/* In Progress */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">Em Progresso (Onboarding)</span>
                            <span className="text-neon-blue font-bold">{journeyStats.inProgress.count}</span>
                        </div>
                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-neon-blue" style={{ width: `${journeyStats.inProgress.percent}%` }}></div>
                        </div>
                    </div>

                    {/* Not Started */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Não Iniciado / Setup</span>
                            <span className="text-gray-400 font-bold">{journeyStats.notStarted.count}</span>
                        </div>
                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-600" style={{ width: `${journeyStats.notStarted.percent}%` }}></div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Retention Chart on Dashboard */}
            <div className="col-span-1 md:col-span-2">
                <RetentionEvolutionChart 
                    onClick={() => navigate('/retention')}
                    className="cursor-pointer hover:border-white/20 transition-all border border-white/5"
                />
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
            {/* ... Focus Content ... */}
            {/* (Keeping existing Focus Mode content mostly same for brevity, assuming no changes requested there) */}
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