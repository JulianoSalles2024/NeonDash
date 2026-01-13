import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GaugeProps {
    current: number;
    target: number;
    label: string;
}

const Gauge: React.FC<GaugeProps> = ({ current, target, label }) => {
    // Cálculo seguro da porcentagem (com limite visual de 120% para overdrive)
    const rawPercentage = target > 0 ? (current / target) : 0;
    const percentage = Math.min(Math.max(rawPercentage, 0), 1.2); 
    
    // Mapeia 0-1.2 para graus (-180 a 0 é o semi-círculo padrão, mas vamos fazer estilo conta-giros 240 graus)
    // Vamos usar um arco de 240 graus: -210deg (início) a 30deg (fim)
    const startAngle = -210;
    const endAngle = 30;
    const totalAngle = endAngle - startAngle;
    const rotation = startAngle + (totalAngle * (percentage / 1.2)); // Normaliza para a escala visual máxima de 120%

    // Estado para animação suave do número
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayValue(prev => {
                const diff = current - prev;
                if (Math.abs(diff) < 1) return current;
                return prev + diff * 0.1;
            });
        }, 16);
        return () => clearInterval(interval);
    }, [current]);

    // Definição de cores dinâmicas
    let zoneColor = '#7CFCF3'; // Cyan (Ideal)
    let glowColor = 'rgba(124,252,243,0.5)';

    if (percentage < 0.25) {
        zoneColor = '#ef4444'; // Red (Risk)
        glowColor = 'rgba(239,68,68,0.5)';
    } else if (percentage < 0.50) {
        zoneColor = '#eab308'; // Yellow (Warning)
        glowColor = 'rgba(234,179,8,0.5)';
    } else if (percentage >= 1.0) {
        zoneColor = '#9B5CFF'; // Purple (Overdrive)
        glowColor = 'rgba(155,92,255,0.6)';
    }

    return (
        <div className="relative w-full max-w-[850px] aspect-[2/1] mx-auto flex flex-col items-center justify-end pb-4">
            {/* SVG Gauge */}
            <svg viewBox="0 0 400 220" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                        <stop offset="40%" stopColor="#eab308" stopOpacity="0.8" />
                        <stop offset="70%" stopColor="#7CFCF3" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#9B5CFF" stopOpacity="0.9" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Background Arc (Track) - Mais grosso */}
                <path 
                    d="M 60 180 A 140 140 0 1 1 340 180"
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="35" 
                    strokeLinecap="round"
                />

                {/* Ticks */}
                {Array.from({ length: 9 }).map((_, i) => {
                    const tickAngle = startAngle + (totalAngle * (i / 8));
                    const isMajor = i % 2 === 0;
                    return (
                        <g key={i} transform={`translate(200, 180) rotate(${tickAngle}) translate(0, -140)`}>
                            <rect 
                                x={-1} 
                                y={isMajor ? -15 : 0} 
                                width={isMajor ? 4 : 2} 
                                height={isMajor ? 15 : 8} 
                                fill={isMajor ? '#fff' : '#4b5563'} 
                            />
                        </g>
                    );
                })}

                {/* Active Arc (Colored) */}
                <path 
                    d="M 60 180 A 140 140 0 1 1 340 180"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="565" // Circumference approx
                    strokeDashoffset={565 * (1 - Math.min(percentage / 1.2, 1))} 
                    className="transition-all duration-1000 ease-out opacity-60"
                />

                {/* Needle */}
                <g 
                    className="transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
                    style={{ transform: `translate(200px, 180px) rotate(${rotation}deg)` }}
                >
                    {/* Ponteiro maior e mais visível */}
                    <path 
                        d="M -6 0 L 0 -135 L 6 0 Z" 
                        fill={zoneColor} 
                        filter="url(#glow)"
                    />
                    {/* Base do ponteiro */}
                    <circle cx="0" cy="0" r="10" fill="#fff" />
                    <circle cx="0" cy="0" r="18" stroke={zoneColor} strokeWidth="3" fill="none" opacity="0.5" />
                </g>

                {/* Labels - Fontes maiores */}
                <text x="50" y="215" textAnchor="middle" fill="#6b7280" fontSize="16" fontWeight="bold">0%</text>
                <text x="350" y="215" textAnchor="middle" fill="#6b7280" fontSize="16" fontWeight="bold">120%</text>
            </svg>

            {/* Central Info - Aumentado Significativamente */}
            <div className="absolute bottom-0 text-center flex flex-col items-center translate-y-6">
                <div className="flex items-baseline gap-2 relative mb-1">
                    <span 
                        className="text-8xl font-display font-bold text-white transition-colors duration-500 tracking-tighter"
                        style={{ textShadow: `0 0 40px ${glowColor}` }}
                    >
                        {Math.round(displayValue)}
                    </span>
                    <span className="text-gray-500 text-2xl font-medium relative -top-6">/ {target}</span>
                </div>
                
                <p className="text-neon-cyan/80 text-sm uppercase tracking-[0.3em] font-bold mb-4">{label}</p>
                
                {/* Status Badge Dinâmico - Maior */}
                <div className="mt-2">
                    {percentage >= 1.0 ? (
                        <span className="px-4 py-1.5 rounded-lg bg-neon-purple/20 text-neon-purple border border-neon-purple/50 text-sm font-bold uppercase tracking-wider animate-pulse shadow-[0_0_25px_rgba(155,92,255,0.4)]">
                            Overdrive
                        </span>
                    ) : percentage >= 0.75 ? (
                        <span className="px-4 py-1.5 rounded-lg bg-neon-green/20 text-neon-green border border-neon-green/30 text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(52,255,176,0.2)]">
                            Zona Ideal
                        </span>
                    ) : percentage >= 0.25 ? (
                        <span className="px-4 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 text-sm font-bold uppercase tracking-wider">
                            Atenção
                        </span>
                    ) : (
                        <span className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-500 border border-red-500/30 text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                            Zona de Risco
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Gauge;
