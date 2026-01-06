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
            bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl p-6
            shadow-lg transition-all duration-300 group
            hover:bg-white/[0.04] hover:border-white/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]
            ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        `}
        onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        {/* Title */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">
            {title}
        </p>
        
        {/* Icon (Always visible but subtle, lights up on hover) */}
        {icon && (
            <div className="text-gray-600 group-hover:text-neon-cyan transition-colors duration-300 scale-100 origin-top-right bg-white/5 p-2 rounded-lg">
                {icon}
            </div>
        )}
      </div>

      {/* Main Value */}
      <div className="flex items-baseline gap-3 mb-2">
        {isLoading ? (
            <div className="h-10 w-32 bg-white/5 rounded animate-pulse"></div>
        ) : (
            <h3 className="text-4xl font-bold text-white font-display tracking-tight drop-shadow-md">
                {value}
            </h3>
        )}
      </div>
      
      {/* Footer: Trend / SubValue */}
      <div className="flex items-center">
        {isLoading ? (
            <div className="h-5 w-20 bg-white/5 rounded animate-pulse"></div>
        ) : (
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 ${subColor}`}>
                    {subValue}
                </span>
            </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;