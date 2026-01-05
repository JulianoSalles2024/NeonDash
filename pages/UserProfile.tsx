import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MoreHorizontal, Shield, Clock, AlertTriangle, CheckCircle, Info, LayoutDashboard, History, Zap, MessageSquare, DollarSign } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { COLORS } from '../constants';
import { useUserStore } from '../store/useUserStore';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');
  
  // Fetch user from Global Store
  const user = useUserStore((state) => state.users.find(u => u.id === id));

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

  // Ensure metrics exist (backward compatibility fallback)
  const metrics = user.metrics || { engagement: 50, support: 50, finance: 50, risk: 50 };

  // Use Real History if available, otherwise show empty state
  const userHistory = user.history || [];

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

  // Helper para formatar data crua do DB
  const formatLastActive = (dateStr: string) => {
      if (!dateStr || dateStr === 'Nunca') return 'Nunca';
      if (dateStr === 'Agora') return 'Agora';
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : dateStr;
  };

  // Mock mini chart data specifically for this user view
  const USER_ACTIVITY_DATA = [
      { name: 'Seg', value: 20 }, { name: 'Ter', value: 45 }, { name: 'Qua', value: 30 }, 
      { name: 'Qui', value: 50 }, { name: 'Sex', value: 80 }, { name: 'Sab', value: 65 }, 
      { name: 'Dom', value: user.healthScore }
  ];

  const MetricPill = ({ label, value, color, icon: Icon }: any) => (
    <div className="flex flex-col p-3 rounded-lg bg-white/5 border border-white/5">
        <div className="flex justify-between items-start mb-2">
            <span className={`p-1.5 rounded-md ${color.bg} ${color.text}`}>
                <Icon size={14} />
            </span>
            <span className="text-lg font-bold text-white font-mono">{value}</span>
        </div>
        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
            <div className={`h-full ${color.bar}`} style={{width: `${value}%`}}></div>
        </div>
        <span className="text-[10px] text-gray-500 uppercase mt-2">{label}</span>
    </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto pb-20">
      <div className="mb-6">
        <button 
            onClick={() => navigate('/users')} 
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm group"
        >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar para Usuários
        </button>
      </div>

      {/* Identity Header */}
      <Card className="mb-8 p-8 border-white/10 relative overflow-hidden group">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl group-hover:bg-neon-cyan/10 transition-all duration-700"></div>

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative z-10">
            
            {/* User Info Section */}
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                    {/* Pulsing Status Dot */}
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

            {/* Health Score Gauge (Right Side) */}
            <div className="flex items-center gap-8 xl:pl-12 xl:border-l xl:border-white/10">
                 <div className="text-right hidden xl:block">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Health Score</p>
                    <p className={`text-base font-medium ${user.healthScore > 70 ? 'text-neon-green' : 'text-yellow-500'}`}>
                        {user.healthScore > 70 ? 'Saúde Excelente' : 'Atenção Necessária'}
                    </p>
                 </div>

                 <div className="relative flex items-center justify-center w-28 h-28">
                     {/* Background Circle */}
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

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 mb-8">
        <button 
            onClick={() => setActiveTab('overview')}
            className={`
                flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all
                ${activeTab === 'overview' 
                    ? 'border-neon-cyan text-neon-cyan' 
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10'}
            `}
        >
            <LayoutDashboard size={18} /> Visão Geral
        </button>
        <button 
            onClick={() => setActiveTab('timeline')}
            className={`
                flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all
                ${activeTab === 'timeline' 
                    ? 'border-neon-cyan text-neon-cyan' 
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10'}
            `}
        >
            <History size={18} /> Linha do Tempo
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6"
            >
                {/* Stats Chart */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-8 min-h-[300px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-white">Engajamento Semanal</h3>
                        <span className="px-2 py-1 bg-neon-cyan/10 text-neon-cyan text-xs font-bold rounded border border-neon-cyan/20">+12% vs anterior</span>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={USER_ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOverview" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0B0F1A', borderColor: '#374151', color: '#fff' }}
                                    cursor={{stroke: 'rgba(255,255,255,0.1)'}} 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={COLORS.cyan} 
                                    strokeWidth={3}
                                    fill="url(#colorOverview)"
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Side Actions & Risk */}
                <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-6">
                    {/* Metrics Breakdown */}
                    <Card>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Composição de Saúde</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <MetricPill 
                                label="Engajamento" 
                                value={metrics.engagement} 
                                icon={Zap}
                                color={{bg: 'bg-neon-blue/10', text: 'text-neon-blue', bar: 'bg-neon-blue'}} 
                            />
                            <MetricPill 
                                label="Suporte" 
                                value={metrics.support} 
                                icon={MessageSquare}
                                color={{bg: 'bg-neon-green/10', text: 'text-neon-green', bar: 'bg-neon-green'}} 
                            />
                            <MetricPill 
                                label="Financeiro" 
                                value={metrics.finance} 
                                icon={DollarSign}
                                color={{bg: 'bg-neon-purple/10', text: 'text-neon-purple', bar: 'bg-neon-purple'}} 
                            />
                            <MetricPill 
                                label="Risco (Churn)" 
                                value={metrics.risk} 
                                icon={AlertTriangle}
                                color={{bg: 'bg-neon-pink/10', text: 'text-neon-pink', bar: 'bg-neon-pink'}} 
                            />
                        </div>
                    </Card>

                    <Card className="border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg text-red-400 shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-red-400 mb-1">Análise de Risco</p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {user.healthScore < 40 
                                        ? "Usuário crítico. O score financeiro ou de risco está puxando a média para baixo drasticamente." 
                                        : "O padrão de uso é estável, mas monitore as métricas de engajamento."}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto"
            >
                <div className="relative pl-6">
                    {/* Continuous Vertical Line */}
                    <div className="absolute left-[3rem] top-4 bottom-8 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent -translate-x-1/2"></div>

                    <div className="space-y-6">
                        {userHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-sm">Nenhum evento registrado ainda.</p>
                                <p className="text-gray-600 text-xs mt-1">Interações e atualizações aparecerão aqui.</p>
                            </div>
                        ) : (
                            userHistory.map((event, index) => (
                                <div key={event.id} className="relative flex items-start gap-6 group">
                                    
                                    {/* Connection Dot */}
                                    <div className={`
                                        relative z-10 w-12 h-12 rounded-xl border border-white/10 bg-[#0B0F1A] flex items-center justify-center shrink-0 
                                        transition-all duration-300 group-hover:scale-110 group-hover:border-white/30
                                        ${getEventColor(event.type).replace('bg-', 'text-').split(' ')[0]} 
                                    `}>
                                        {getEventIcon(event.type)}
                                    </div>
                                    
                                    {/* Card Content */}
                                    <Card className="flex-1 py-5 px-6 hover:bg-white/[0.04] transition-colors border-white/5 hover:border-white/20">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                                            <p className="font-semibold text-white text-base">{event.title}</p>
                                            <span className="text-xs text-gray-500 font-mono px-2 py-1 bg-white/5 rounded border border-white/5 whitespace-nowrap">
                                                {event.timestamp}
                                            </span>
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
    </div>
  );
};

export default UserProfile;