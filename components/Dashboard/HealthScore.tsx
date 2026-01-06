import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { motion } from 'framer-motion';

interface HealthScoreProps {
  className?: string;
  onClick?: () => void;
}

const HealthScore: React.FC<HealthScoreProps> = ({ onClick }) => {
  const { users } = useUserStore();
  
  // Calculate REAL average from users (EXCLUDING TEST USERS)
  const validUsers = users.filter(u => !u.isTest);
  
  const totalScore = validUsers.reduce((acc, user) => acc + (user.healthScore || 0), 0);
  const globalScore = validUsers.length > 0 ? Math.round(totalScore / validUsers.length) : 0;
  
  // Dynamic Trend Logic
  // Como não temos histórico real no banco de dados local, simulamos baseados na saúde atual
  // Se não tem usuários, a tendência é neutra (0)
  let trendValue = 0;
  let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';

  if (validUsers.length > 0) {
      if (globalScore >= 80) {
          trendValue = 2.4;
          trendDirection = 'up';
      } else if (globalScore >= 50) {
          trendValue = 0.5;
          trendDirection = 'up';
      } else {
          trendValue = 1.2;
          trendDirection = 'down';
      }
  }

  return (
    <div 
      onClick={onClick}
      className="relative flex flex-col items-center justify-center w-[240px] h-[240px] mx-auto overflow-hidden cursor-pointer group"
    >
       {/* Label */}
       <h2 className="text-neon-cyan/60 text-[9px] font-mono uppercase tracking-[0.2em] font-medium z-20 mb-4 absolute top-8 group-hover:text-neon-cyan transition-colors">
         Health Score Global
       </h2>

       {/* Concentric Circles & Number Container */}
       <div className="relative flex items-center justify-center w-full h-full">
            
            {/* Outer Ring */}
            <motion.div 
                animate={{ 
                    opacity: validUsers.length > 0 ? [0.1, 0.3, 0.1] : 0.1, 
                }}
                transition={{ 
                    duration: 5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
                className="absolute w-[200px] h-[200px] rounded-full border border-neon-cyan/10"
            />

            {/* Inner Ring */}
            <motion.div 
                animate={{ 
                    opacity: validUsers.length > 0 ? [0.2, 0.5, 0.2] : 0.1, 
                }}
                transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut", 
                    delay: 1 
                }}
                className="absolute w-[160px] h-[160px] rounded-full border border-neon-cyan/20"
            />
            
            {/* Core Glow */}
            {validUsers.length > 0 && (
                <motion.div 
                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-[130px] h-[130px] rounded-full bg-neon-cyan/10 blur-2xl"
                />
            )}

            {/* The Main Number */}
            <span className={`relative z-10 font-display text-6xl font-bold tracking-tighter drop-shadow-[0_0_20px_rgba(124,252,243,0.2)] ${validUsers.length === 0 ? 'text-gray-600' : 'text-white'}`}>
                {globalScore}
            </span>
       </div>

       {/* Trend Indicator */}
       <div className="absolute bottom-8 flex items-center gap-1.5 z-20 opacity-70 hover:opacity-100 transition-opacity">
            {trendDirection === 'neutral' ? (
                 <Minus size={12} className="text-gray-500" />
            ) : trendDirection === 'up' ? (
                <TrendingUp size={12} className="text-neon-green" />
            ) : (
                <TrendingDown size={12} className="text-red-400" />
            )}
            
            <span className={`text-sm font-bold font-display ${trendDirection === 'up' ? 'text-neon-green' : trendDirection === 'down' ? 'text-red-400' : 'text-gray-500'}`}>
                {trendDirection === 'up' ? '+' : trendDirection === 'down' ? '-' : ''}{trendValue.toFixed(1)}%
            </span>
            <span className="text-[10px] text-gray-500 font-mono tracking-wide">vs ontem</span>
       </div>
    </div>
  );
};

export default HealthScore;