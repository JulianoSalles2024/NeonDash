import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HealthScore from '../components/Dashboard/HealthScore';
import MetricCard from '../components/Dashboard/MetricCard';
import AIStrip from '../components/Dashboard/AIStrip';
import Card from '../components/ui/Card';
import PageTransition from '../components/ui/PageTransition';
import { COLORS } from '../constants';
import { useUserStore } from '../store/useUserStore';
import { useTimeframeStore } from '../store/useTimeframeStore';
import { fetchDashboardMetrics } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users as UsersIcon, Activity, AlertTriangle, Zap, Server, Pause, Play, Trash2 } from 'lucide-react';
import { useEventStream } from '../hooks/useEventStream';

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

  // --- KPI CALCULATIONS (EXCLUDING TEST USERS) ---
  const validUsers = users.filter(u => !u.isTest);

  const totalUsers = validUsers.length;
  // Calculate MRR (exclude churned users)
  const totalMRR = validUsers.reduce((acc, user) => acc + (user.status !== 'Cancelado' ? user.mrr : 0), 0);
  // Calculate Churn Rate (Churned / Total)
  const churnedCount = validUsers.filter(u => u.status === 'Cancelado').length;
  const churnRate = validUsers.length > 0 ? (churnedCount / validUsers.length) * 100 : 0;
  // Calculate Avg Health
  const totalScore = validUsers.reduce((acc, user) => acc + (user.healthScore || 0), 0);
  const globalScore = validUsers.length > 0 ? Math.round(totalScore / validUsers.length) : 0;
  
  // Get global timeframe
  const { timeframe } = useTimeframeStore();

  // Fetch chart history - PASSING REAL DATA TO MOCK GENERATOR
  const { data, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['dashboardMetrics', timeframe, totalUsers, totalMRR, churnRate], // Refetch when data changes
    queryFn: () => fetchDashboardMetrics(timeframe, {
        users: totalUsers,
        mrr: totalMRR,
        churn: churnRate,
        health: globalScore
    }),
    refetchInterval: 30000, 
  });

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

      <AIStrip />

      {activeTab === 'overview' ? (
        /* --- OVERVIEW TAB CONTENT --- */
        <motion.div 
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            
            {/* Row 1: Vital Metrics (Full Width Row) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    title="Total de Usuários (Reais)"
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

            {/* Row 2: Centralized Health Score (Transparent Floating Indicator) */}
            <div className="flex justify-center w-full">
                <HealthScore onClick={() => navigate('/health')} />
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
            {/* 1. TOP SECTION: THE STREAM (Expanded) */}
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

                <div className="relative min-h-[500px] bg-white/[0.01] rounded-xl border border-white/5 p-4">
                    <AnimatePresence initial={false}>
                        {events.map((event) => {
                            // Helper inside map
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
                                        {isCritical ? <AlertTriangle size={24} /> : isWarning ? <Zap size={24} /> : isSuccess ? <Activity size={24} /> : <Server size={24} />}
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

            {/* 2. BOTTOM SECTION: KPIS MOVED HERE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-red-500/30 bg-red-500/5 hover:border-red-500/50 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded bg-red-500/20 text-red-500"><AlertTriangle size={20} /></div>
                                <span className="text-sm font-bold text-red-400 uppercase">Críticos</span>
                        </div>
                        <p className="text-4xl font-display font-bold text-white mt-4">3</p>
                        <p className="text-xs text-red-300 mt-1">Requerem ação imediata</p>
                    </Card>

                    <Card className="border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded bg-yellow-500/20 text-yellow-500"><Activity size={20} /></div>
                                <span className="text-sm font-bold text-yellow-500 uppercase">Avisos</span>
                        </div>
                        <p className="text-4xl font-display font-bold text-white mt-4">12</p>
                        <p className="text-xs text-yellow-300 mt-1">Monitorar de perto</p>
                    </Card>
                    
                    <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02]">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Fontes de Erro (Top 3)</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">API Gateway</span> <span className="text-red-400 font-mono">8</span></div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full"><div className="h-full w-2/3 bg-red-500/50 rounded-full"></div></div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">Billing</span> <span className="text-yellow-400 font-mono">3</span></div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full"><div className="h-full w-1/4 bg-yellow-500/50 rounded-full"></div></div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">Auth Service</span> <span className="text-neon-blue font-mono">1</span></div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full"><div className="h-full w-[10%] bg-neon-blue/50 rounded-full"></div></div>
                            </div>
                        </div>
                    </div>
            </div>
        </motion.div>
      )}
    </PageTransition>
  );
};

export default Dashboard;