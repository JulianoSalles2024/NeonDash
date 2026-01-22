import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HealthScore from '../components/Dashboard/HealthScore';
import MetricCard from '../components/Dashboard/MetricCard';
import Card from '../components/ui/Card';
import PageTransition from '../components/ui/PageTransition';
import { COLORS } from '../constants';
import { UserStatus } from '../types';
import { useUserStore } from '../store/useUserStore';
import { useTimeframeStore } from '../store/useTimeframeStore';
import { fetchDashboardMetrics } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users as UsersIcon, Activity, Crown, Zap, Target, Gem, Trophy, CheckCircle, AlertCircle } from 'lucide-react';
import { useEventStream } from '../hooks/useEventStream';
import RankingView from '../components/Dashboard/RankingView';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'focus' | 'ranking'>('overview');
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
      const total = activeBase.length > 0 ? activeBase.length : 1;
      
      let countActivation = 0;
      let countMethod = 0;
      let countExecution = 0;
      let countValue = 0;
      let countUpsell = 0; // <<< NOVO CONTADOR

      activeBase.forEach(u => {
          const steps = u.journey?.steps || [];
          // IDs baseados no template: 1=Ativação, 2=Método, 3=Execução, 4=Valor, 5=Upsell
          const s1 = steps.find(s => s.id === '1')?.isCompleted;
          const s2 = steps.find(s => s.id === '2')?.isCompleted;
          const s3 = steps.find(s => s.id === '3')?.isCompleted;
          const s4 = steps.find(s => s.id === '4')?.isCompleted;
          const s5 = steps.find(s => s.id === '5')?.isCompleted; // <<< NOVO PASSO

          // REGRAS DE NEGÓCIO ATUALIZADAS:
          
          // 1. Card Ativação: Usuários que AINDA NÃO ativaram (Passo 1 Pendente)
          if (!s1) {
              countActivation++;
          }
          // 2. Card Método: Concluíram passo 1, mas não o 3
          else if (s1 && !s3) {
              countMethod++;
          }
          // 3. Card Execução: Concluíram passo 3, mas não o 4
          else if (s3 && !s4) {
              countExecution++;
          }
          // 4. Card Valor: Concluíram passo 4, mas não o 5 (Upsell)
          else if (s4 && !s5) {
              countValue++;
          }
          // 5. Card Upsell: Concluíram o passo 5
          else if (s5) {
              countUpsell++;
          }
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
              containerClass: 'bg-gradient-to-br from-red-500/10 to-transparent border-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
              accentClass: 'bg-red-500',
              barClass: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
          },
          { 
              id: 'method', 
              label: 'Método', 
              insight: 'Setup em Andamento', 
              desc: 'Estruturando o método antes da execução assistida.',
              count: countMethod, 
              percent: (countMethod / total) * 100,
              color: 'text-orange-400', 
              icon: CheckCircle,
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
              containerClass: 'bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/30 hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
              accentClass: 'bg-blue-500',
              barClass: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]'
          },
          { 
              id: 'value', 
              label: 'Valor', 
              insight: 'Valor Gerado', 
              desc: 'Sucesso comprovado. Candidatos a expansão.',
              count: countValue, 
              percent: (countValue / total) * 100,
              color: 'text-neon-green', 
              icon: Gem,
              special: true,
              containerClass: 'bg-gradient-to-br from-neon-green/10 to-transparent border-neon-green/30 hover:border-neon-green/60 hover:shadow-[0_0_25px_rgba(52,255,176,0.2)]',
              accentClass: 'bg-neon-green',
              barClass: 'bg-neon-green shadow-[0_0_15px_rgba(52,255,176,0.8)]'
          },
          { // <<< NOVO CARD DE UPSELL
              id: 'upsell', 
              label: 'Upsell', 
              insight: 'Expansão', 
              desc: 'Clientes que atingiram o sucesso e expandiram o valor.',
              count: countUpsell, 
              percent: (countUpsell / total) * 100,
              color: 'text-yellow-400', 
              icon: Crown,
              special: true,
              containerClass: 'bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/30 hover:border-yellow-500/60 hover:shadow-[0_0_25px_rgba(234,179,8,0.2)]',
              accentClass: 'bg-yellow-500',
              barClass: 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]'
          }
      ];
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
                onClick={() => setActiveTab('ranking')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'ranking' ? 'bg-yellow-500/20 text-yellow-500 shadow-sm border border-yellow-500/10' : 'text-gray-400 hover:text-white'}`}
            >
                <Trophy size={14} /> Ranking
            </button>
            <button 
                onClick={() => setActiveTab('focus')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'focus' ? 'bg-red-500/20 text-red-400 shadow-sm border border-red-500/10' : 'text-gray-400 hover:text-white'}`}
            >
                {activeTab === 'focus' && <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>}
                Modo Foco
            </button>
        </div>
      </div>

      {activeTab === 'overview' && (
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

            {/* --- BOTTOM ROW: JOURNEY CARDS --- */}
            <div className="col-span-1 md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {frictionStats.map((stat) => (
                    <div 
                        key={stat.id}
                        className={`
                            relative flex flex-col p-5 rounded-xl border transition-all duration-300 group min-h-[180px]
                            ${stat.containerClass}
                        `}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg ${stat.color} bg-black/20`}>
                                <stat.icon size={20} />
                            </div>
                            <span className={`text-2xl font-display font-bold ${stat.color}`}>{stat.count}</span>
                        </div>
                        
                        <div className="mt-auto">
                            <h4 className={`text-sm font-bold text-white mb-1 ${stat.special ? 'text-neon-green' : ''}`}>{stat.label}</h4>
                            <p className="text-[10px] text-gray-400 leading-tight mb-3 min-h-[2.5em]">{stat.desc}</p>
                            
                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${stat.barClass}`} 
                                    style={{ width: `${stat.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
      )}

      {activeTab === 'ranking' && (
          <RankingView />
      )}

      {activeTab === 'focus' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center min-h-[400px] text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]"
          >
              <div className="p-4 rounded-full bg-red-500/10 mb-4 animate-pulse">
                  <Target size={48} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Modo Foco Ativo</h3>
              <p className="text-gray-500 max-w-md mt-2">
                  Esta visualização remove distrações e mostra apenas métricas críticas em tempo real.
                  <br/><span className="text-xs text-gray-600">(Funcionalidade em desenvolvimento)</span>
              </p>
          </motion.div>
      )}
    </PageTransition>
  );
};

export default Dashboard;
