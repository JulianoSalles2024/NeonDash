import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { MOCK_INSIGHTS } from '../../constants';

const AIStrip: React.FC = () => {
  const topInsight = MOCK_INSIGHTS[0];

  return (
    <div className="w-full bg-gradient-to-r from-neon-purple/20 to-neon-blue/10 border-y border-white/5 py-2 px-6 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-neon-purple">
                <Sparkles size={16} className="animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Insight IA</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <p className="text-sm text-gray-200">
                {topInsight.message} <span className="text-gray-500 text-xs ml-2">{topInsight.timestamp}</span>
            </p>
        </div>
        <button className="text-xs font-medium text-neon-cyan hover:text-white flex items-center gap-1 transition-colors">
            Ver Raciocínio <ArrowRight size={12} />
        </button>
    </div>
  );
};

export default AIStrip;