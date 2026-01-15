import React, { useMemo, useState } from 'react';
import { Trophy, Crown, ChevronRight, Zap, Target, Flame, Rocket, Star, User as UserIcon, ChevronLeft } from 'lucide-react';
import { User, UserStatus } from '../../types';
import { useUserStore } from '../../store/useUserStore';
import Card from '../ui/Card';
import { useNavigate } from 'react-router-dom';

// --- PESOS E LÓGICA DE SCORE ---
const STAGE_WEIGHTS: Record<string, number> = {
    '1': 100, // Ativação
    '2': 250, // Método
    '3': 500, // Execução
    '4': 800, // Valor Gerado
    '5': 1000 // Escala
};

const ITEMS_PER_PAGE = 10;

const calculateEngagementScore = (user: User): number => {
    let score = 0;

    // 1. Base Score (Health)
    score += (user.healthScore || 0) * 2;

    // 2. Journey Progress (Peso Alto)
    if (user.journey?.steps) {
        user.journey.steps.forEach(step => {
            if (step.isCompleted) {
                score += STAGE_WEIGHTS[step.id] || 50;
            }
        });
    }

    // 3. Activity Bonus
    if (user.lastActive === 'Agora') score += 150;
    else {
        const lastActiveDate = new Date(user.lastActive);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays <= 1) score += 100;
        else if (diffDays <= 3) score += 50;
        else if (diffDays <= 7) score += 20;
    }

    // 4. MRR Bonus (Skin in the game)
    if (user.mrr > 0) score += Math.min(200, user.mrr / 10); // Cap em 200pts

    return Math.round(score);
};

const getStageBadge = (user: User) => {
    const steps = user.journey?.steps || [];
    const completed = steps.filter(s => s.isCompleted);
    const lastCompleted = completed.length > 0 ? completed[completed.length - 1] : null;

    if (!lastCompleted) return { label: 'Setup', color: 'bg-gray-700 text-gray-300 border-gray-600', icon: Target };
    
    // Mapeamento visual baseado no ID do passo (1 a 5)
    switch(lastCompleted.id) {
        case '5': return { label: 'Escala / Upsell', color: 'bg-neon-purple/20 text-neon-purple border-neon-purple/40 shadow-[0_0_10px_rgba(155,92,255,0.3)]', icon: Rocket };
        case '4': return { label: 'Valor Gerado', color: 'bg-neon-green/20 text-neon-green border-neon-green/40 shadow-[0_0_10px_rgba(52,255,176,0.3)]', icon: Trophy };
        case '3': return { label: 'Execução', color: 'bg-neon-blue/20 text-neon-blue border-neon-blue/40', icon: Zap };
        case '2': return { label: 'Método', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40', icon: Target };
        default: return { label: 'Ativação', color: 'bg-gray-700 text-white border-gray-500', icon: Target };
    }
};

const PodiumCard = ({ user, rank, score, onClick }: { user: User, rank: number, score: number, onClick: () => void }) => {
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const badge = getStageBadge(user);
    const BadgeIcon = badge.icon;

    return (
        <div 
            onClick={onClick}
            className={`
                relative flex flex-col items-center p-6 rounded-2xl border cursor-pointer transition-all duration-300 group
                ${isFirst 
                    ? 'bg-gradient-to-b from-neon-cyan/20 to-[#0B0F1A] border-neon-cyan/50 shadow-[0_0_40px_rgba(124,252,243,0.15)] scale-110 z-10 order-2' 
                    : isSecond
                        ? 'bg-white/[0.03] border-white/20 hover:bg-white/[0.06] order-1 mt-8'
                        : 'bg-white/[0.03] border-white/20 hover:bg-white/[0.06] order-3 mt-12'
                }
            `}
        >
            {/* Rank Badge */}
            <div className={`
                absolute -top-4 w-10 h-10 flex items-center justify-center rounded-full font-display font-bold text-lg border-2
                ${isFirst ? 'bg-neon-cyan text-dark-bg border-white' : isSecond ? 'bg-gray-300 text-dark-bg border-white' : 'bg-orange-700 text-white border-white'}
            `}>
                {rank}
            </div>

            {isFirst && <Crown size={32} className="text-yellow-400 absolute -top-14 animate-bounce" />}

            {/* Avatar Container */}
            <div className="relative mb-3 mt-2">
                <div className={`
                    flex items-center justify-center rounded-full border-2 bg-gradient-to-b from-white/10 to-transparent
                    ${isFirst 
                        ? 'w-20 h-20 border-neon-cyan shadow-[0_0_20px_rgba(124,252,243,0.2)]' 
                        : 'w-16 h-16 border-white/20'
                    }
                `}>
                    <UserIcon 
                        size={isFirst ? 40 : 32} 
                        className={isFirst ? 'text-neon-cyan' : 'text-gray-400'} 
                    />
                </div>
                
                {user.status === 'Ativo' && <div className="absolute bottom-0 right-0 w-4 h-4 bg-neon-green border-2 border-dark-bg rounded-full shadow-[0_0_5px_#34FFB0]"></div>}
            </div>

            <h3 className="font-bold text-white text-center line-clamp-1">{user.name}</h3>
            <p className="text-xs text-gray-400 mb-3">{user.company}</p>

            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border mb-3 ${badge.color}`}>
                <BadgeIcon size={10} /> {badge.label}
            </div>

            <div className="mt-auto flex flex-col items-center">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Score</span>
                <span className={`font-display font-bold ${isFirst ? 'text-3xl text-neon-cyan' : 'text-2xl text-white'}`}>
                    {score}
                </span>
            </div>
        </div>
    );
};

const RankingView: React.FC = () => {
    const navigate = useNavigate();
    const { users } = useUserStore();
    const [currentPage, setCurrentPage] = useState(1);

    // Lógica de Ranking Global (Todos os usuários rankeados)
    const rankedUsers = useMemo(() => {
        return users
            .filter(u => u.status !== UserStatus.CHURNED && !u.isTest) // Apenas usuários reais e ativos/risco
            .map(u => ({ ...u, score: calculateEngagementScore(u) }))
            .sort((a, b) => b.score - a.score);
    }, [users]);

    // Paginação
    const totalPages = Math.ceil(rankedUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    // Pega os itens da página atual (ex: 0 a 10 para página 1)
    const pageData = rankedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Lógica de Exibição
    // Se página 1: Separa Top 3 para o Pódio e Resto (7) para a lista
    // Se página > 1: Todos os 10 vão para a lista
    const isFirstPage = currentPage === 1;
    const podiumUsers = isFirstPage ? pageData.slice(0, 3) : [];
    const listUsers = isFirstPage ? pageData.slice(3) : pageData;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Scroll suave para o topo do componente se necessário (opcional)
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header / Stats Summary */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={24} /> Ranking de Engajamento
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Usuários classificados por avanço na jornada, saúde e atividade recente.
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-neon-green/10 border border-neon-green/20 rounded-lg text-xs font-bold text-neon-green flex items-center gap-2">
                        <Star size={12} /> {rankedUsers.filter(u => u.score > 2000).length} High Performers
                    </div>
                </div>
            </div>

            {/* PODIUM SECTION (ONLY ON PAGE 1) */}
            {isFirstPage && podiumUsers.length > 0 && (
                <div className="flex justify-center gap-4 md:gap-8 min-h-[320px] px-4">
                    {podiumUsers[1] && <PodiumCard user={podiumUsers[1]} rank={2} score={podiumUsers[1].score} onClick={() => navigate(`/users/${podiumUsers[1].id}`)} />}
                    {podiumUsers[0] && <PodiumCard user={podiumUsers[0]} rank={1} score={podiumUsers[0].score} onClick={() => navigate(`/users/${podiumUsers[0].id}`)} />}
                    {podiumUsers[2] && <PodiumCard user={podiumUsers[2]} rank={3} score={podiumUsers[2].score} onClick={() => navigate(`/users/${podiumUsers[2].id}`)} />}
                </div>
            )}

            {/* LIST SECTION */}
            <Card className="p-0 overflow-hidden border-white/10 bg-white/[0.02]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="p-4 w-16 text-center">#</th>
                            <th className="p-4">Usuário</th>
                            <th className="p-4">Fase da Jornada</th>
                            <th className="p-4">Score</th>
                            <th className="p-4 text-right">Progresso</th>
                            <th className="p-4 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {listUsers.map((user, idx) => {
                            const badge = getStageBadge(user);
                            const BadgeIcon = badge.icon;
                            
                            // Calcula rank absoluto
                            // Se pag 1: rank = idx + 1 (podium) + 3 (offset) = idx + 4
                            // Se pag > 1: rank = startIndex + idx + 1
                            const rank = isFirstPage ? (idx + 4) : (startIndex + idx + 1);
                            
                            const stepsCompleted = user.journey?.steps.filter(s => s.isCompleted).length || 0;
                            const totalSteps = user.journey?.steps.length || 5;
                            const progress = (stepsCompleted / totalSteps) * 100;

                            return (
                                <tr key={user.id} onClick={() => navigate(`/users/${user.id}`)} className="group hover:bg-white/[0.04] transition-colors cursor-pointer">
                                    <td className="p-4 text-center font-mono text-gray-500 font-bold">{rank}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <UserIcon size={16} className="text-gray-400" />
                                                </div>
                                                
                                                {user.score > 1500 && (
                                                    <div className="absolute -top-1 -right-1 text-yellow-400 bg-black rounded-full p-0.5 border border-yellow-400" title="Alta Performance">
                                                        <Flame size={8} fill="currentColor" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white group-hover:text-neon-cyan transition-colors">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.company}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${badge.color}`}>
                                            <BadgeIcon size={10} /> {badge.label}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono font-bold text-white">{user.score}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs text-gray-400 font-mono">{progress.toFixed(0)}%</span>
                                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-neon-cyan transition-all" style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                                            <ChevronRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-white/5 flex justify-between items-center bg-white/[0.01]">
                        <span className="text-xs text-gray-500">
                            Página {currentPage} de {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-lg border border-transparent transition-colors ${currentPage === 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10'}`}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
                                    <button 
                                        key={i + 1}
                                        onClick={() => handlePageChange(i + 1)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-neon-cyan text-dark-bg' : 'text-gray-500 hover:bg-white/5'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`p-2 rounded-lg border border-transparent transition-colors ${currentPage === totalPages ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10'}`}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default RankingView;