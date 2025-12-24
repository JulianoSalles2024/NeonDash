import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { MOCK_INSIGHTS } from '../../constants';
import { generateDashboardInsight } from '../../services/ai';
import { useUserStore } from '../../store/useUserStore';

const AIStrip: React.FC = () => {
  const [insight, setInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { users } = useUserStore();

  useEffect(() => {
    const fetchInsight = async () => {
      setIsLoading(true);
      
      // Prepare context for the AI
      const activeUsers = users.filter(u => u.status === 'Ativo').length;
      const churned = users.filter(u => u.status === 'Cancelado').length;
      const risk = users.filter(u => u.status === 'Risco').length;
      const totalMRR = users.reduce((acc, u) => acc + (u.status !== 'Cancelado' ? u.mrr : 0), 0);
      
      const context = `Total Usuários: ${users.length}, Ativos: ${activeUsers}, Risco: ${risk}, Churn: ${churned}, MRR Total: R$${totalMRR}.`;

      const aiText = await generateDashboardInsight(context);
      
      if (aiText) {
        setInsight(aiText);
      } else {
        // Fallback to mock if API fails or key is missing
        setInsight(MOCK_INSIGHTS[0].message);
      }
      setIsLoading(false);
    };

    fetchInsight();
  }, [users]); // Regenerate if user base changes significantly (store update)

  return (
    <div className="w-full bg-gradient-to-r from-neon-purple/20 to-neon-blue/10 border-y border-white/5 py-2 px-6 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-1.5 text-neon-purple shrink-0">
                <Sparkles size={16} className="animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Gemini Live</span>
            </div>
            <div className="h-4 w-px bg-white/10 shrink-0"></div>
            
            <div className="flex items-center min-w-0">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-xs">Analisando padrões em tempo real...</span>
                    </div>
                ) : (
                    <p className="text-sm text-gray-200 truncate">
                        {insight}
                        <span className="text-gray-500 text-xs ml-2 hidden sm:inline-block">agora</span>
                    </p>
                )}
            </div>
        </div>
        
        <button className="text-xs font-medium text-neon-cyan hover:text-white flex items-center gap-1 transition-colors shrink-0 ml-4">
            Ver Raciocínio <ArrowRight size={12} />
        </button>
    </div>
  );
};

export default AIStrip;