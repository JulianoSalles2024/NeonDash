import React from 'react';
import { ChartDataPoint } from '../../types';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue: string;
  subColor: string;
  chartData: ChartDataPoint[]; // Kept for interface compatibility, but not rendered
  chartColor: string;          // Kept for interface compatibility, but not rendered
  icon?: React.ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
    title, 
    value, 
    subValue, 
    subColor, 
    icon,
    isLoading = false,
    onClick
}) => {
  return (
    <div 
        className={`
            relative flex flex-col justify-center
            bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-xl p-4
            shadow-lg transition-all duration-300 group
            hover:bg-white/[0.04] hover:border-white/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]
            ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        `}
        onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        {/* Title */}
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">
            {title}
        </p>
        
        {/* Icon (Always visible but subtle, lights up on hover) */}
        {icon && (
            <div className="text-gray-600 group-hover:text-neon-cyan transition-colors duration-300 scale-90 origin-top-right">
                {icon}
            </div>
        )}
      </div>

      {/* Main Value */}
      <div className="flex items-baseline gap-3 mb-1">
        {isLoading ? (
            <div className="h-8 w-28 bg-white/5 rounded animate-pulse"></div>
        ) : (
            <h3 className="text-3xl font-bold text-white font-display tracking-tight drop-shadow-md">
                {value}
            </h3>
        )}
      </div>
      
      {/* Footer: Trend / SubValue */}
      <div className="flex items-center">
        {isLoading ? (
            <div className="h-4 w-16 bg-white/5 rounded animate-pulse"></div>
        ) : (
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/5 ${subColor}`}>
                    {subValue}
                </span>
                {/* Optional context text appearing on hover could go here if needed, keeping it clean for now */}
            </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;