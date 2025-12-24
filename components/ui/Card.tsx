import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', glow = false, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl 
        bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent
        backdrop-blur-md border border-white/[0.06]
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:bg-white/[0.08] hover:border-white/10' : ''}
        ${glow ? 'shadow-[0_0_30px_rgba(124,252,243,0.15)] border-neon-cyan/20' : 'shadow-lg hover:shadow-xl'}
        ${className}
      `}
    >
      {/* Subtle top sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-70"></div>
      
      {/* Content */}
      <div className="relative z-10 p-6 h-full">
        {children}
      </div>
    </div>
  );
};

export default Card;