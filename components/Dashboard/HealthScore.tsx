import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useHealthStore } from '../../store/useHealthStore';
import { motion } from 'framer-motion';

interface HealthScoreProps {
  className?: string; // Kept for compatibility but mostly unused for structure now
  onClick?: () => void;
}

const HealthScore: React.FC<HealthScoreProps> = ({ onClick }) => {
  const { globalScore } = useHealthStore();
  const trend = 'up'; // Mock data

  return (
    <div 
      onClick={onClick}
      className="relative flex flex-col items-center justify-center w-[350px] h-[350px] mx-auto overflow-hidden cursor-pointer"
    >
       {/* Label - Technical Monospace look - Positioned carefully */}
       <h2 className="text-neon-cyan/60 text-[10px] font-mono uppercase tracking-[0.3em] font-medium z-20 mb-6 absolute top-12">
         Health Score Global
       </h2>

       {/* Concentric Circles & Number Container */}
       <div className="relative flex items-center justify-center w-full h-full">
            
            {/* Outer Ring - Breathing Opacity ONLY (No scale) */}
            <motion.div 
                animate={{ 
                    opacity: [0.1, 0.3, 0.1], 
                }}
                transition={{ 
                    duration: 5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
                className="absolute w-[280px] h-[280px] rounded-full border border-neon-cyan/10"
            />

            {/* Inner Ring - Breathing Opacity Offset */}
            <motion.div 
                animate={{ 
                    opacity: [0.2, 0.5, 0.2], 
                }}
                transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut", 
                    delay: 1 
                }}
                className="absolute w-[220px] h-[220px] rounded-full border border-neon-cyan/20"
            />
            
            {/* Core Glow (Background Ambience) - Contained */}
            <motion.div 
                animate={{ opacity: [0.05, 0.15, 0.05] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[180px] h-[180px] rounded-full bg-neon-cyan/10 blur-2xl"
            />

            {/* The Main Number */}
            <span className="relative z-10 font-display text-8xl font-bold text-white tracking-tighter drop-shadow-[0_0_20px_rgba(124,252,243,0.2)]">
                {globalScore}
            </span>
       </div>

       {/* Trend Indicator - Floating below center */}
       <div className="absolute bottom-12 flex items-center gap-2 z-20 opacity-80 hover:opacity-100 transition-opacity">
            {trend === 'up' ? <TrendingUp size={16} className="text-neon-green" /> : <TrendingDown size={16} className="text-red-400" />}
            <span className={`text-lg font-bold font-display ${trend === 'up' ? 'text-neon-green' : 'text-red-400'}`}>
                +2.4%
            </span>
            <span className="text-xs text-gray-500 font-mono tracking-wide">vs ontem</span>
       </div>
    </div>
  );
};

export default HealthScore;