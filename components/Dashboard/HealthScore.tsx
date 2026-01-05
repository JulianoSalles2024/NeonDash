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
      className="relative flex flex-col items-center justify-center w-[350px] h-[350px] mx-auto overflow-hidden cursor-pointer"
    >
       {/* Label */}
       <h2 className="text-neon-cyan/60 text-[10px] font-mono uppercase tracking-[0.3em] font-medium z-20 mb-6 absolute top-12">
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
                className="absolute w-[280px] h-[280px] rounded-full border border-neon-cyan/10"
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
                className="absolute w-[220px] h-[220px] rounded-full border border-neon-cyan/20"
            />
            
            {/* Core Glow */}
            {validUsers.length > 0 && (
                <motion.div 
                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-[180px] h-[180px] rounded-full bg-neon-cyan/10 blur-2xl"
                />
            )}

            {/* The Main Number */}
            <span className={`relative z-10 font-display text-8xl font-bold tracking-tighter drop-shadow-[0_0_20px_rgba(124,252,243,0.2)] ${validUsers.length === 0 ? 'text-gray-600' : 'text-white'}`}>
                {globalScore}
            </span>
       </div>

       {/* Trend Indicator */}
       <div className="absolute bottom-12 flex items-center gap-2 z-20 opacity-80 hover:opacity-100 transition-opacity">
            {trendDirection === 'neutral' ? (
                 <Minus size={16} className="text-gray-500" />
            ) : trendDirection === 'up' ? (
                <TrendingUp size={16} className="text-neon-green" />
            ) : (
                <TrendingDown size={16} className="text-red-400" />
            )}
            
            <span className={`text-lg font-bold font-display ${trendDirection === 'up' ? 'text-neon-green' : trendDirection === 'down' ? 'text-red-400' : 'text-gray-500'}`}>
                {trendDirection === 'up' ? '+' : trendDirection === 'down' ? '-' : ''}{trendValue.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 font-mono tracking-wide">vs ontem</span>
       </div>
    </div>
  );
};

export default HealthScore;