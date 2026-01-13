import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GaugeProps {
    current: number;
    target: number;
    label: string;
}

const Gauge: React.FC<GaugeProps> = ({ current, target, label }) => {
    // Percentage 0 to 1.2
    const rawPercentage = target > 0 ? (current / target) : 0;
    const percentage = Math.min(Math.max(rawPercentage, 0), 1.2); 
    
    // Configurações Geométricas (Semi-Círculo 180 graus)
    const cx = 200;
    const cy = 175; // Centro ajustado para baixo para maximizar arco
    const r = 145;  // Raio aumentado para aproveitar largura extra
    
    // Ajuste de rotação para o ponteiro (que é desenhado apontando para CIMA/0deg)
    // Para apontar para a Esquerda (-180deg visual), precisamos girar -90deg do topo.
    // Para apontar para a Direita (0deg visual), precisamos girar +90deg do topo.
    const startAngle = -90;
    const endAngle = 90;
    const totalAngle = endAngle - startAngle;
    
    // Rotação do Ponteiro
    // Mapeia 0 -> 1.2 (percentage) para -90 -> +126
    const rotation = startAngle + (totalAngle * Math.min(percentage, 1.2)); 

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

    // Cores
    let zoneColor = '#7CFCF3'; 
    let glowColor = 'rgba(124,252,243,0.5)';

    if (percentage < 0.25) {
        zoneColor = '#ef4444'; 
        glowColor = 'rgba(239,68,68,0.5)';
    } else if (percentage < 0.50) {
        zoneColor = '#eab308'; 
        glowColor = 'rgba(234,179,8,0.5)';
    } else if (percentage >= 1.0) {
        zoneColor = '#9B5CFF'; 
        glowColor = 'rgba(155,92,255,0.6)';
    }

    // Path do Arco de Fundo (Semicirculo Perfeito)
    const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;

    // Calculo do Dasharray para o arco ativo
    const arcLength = Math.PI * r;
    const fillAmount = Math.min(percentage, 1) * arcLength;

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-end">
            <svg viewBox="0 0 400 230" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                        <stop offset="40%" stopColor="#eab308" stopOpacity="0.8" />
                        <stop offset="70%" stopColor="#7CFCF3" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#9B5CFF" stopOpacity="0.9" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Track Background - Mais Fino */}
                <path 
                    d={trackPath}
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="12" 
                    strokeLinecap="round"
                />

                {/* Ticks - Ajustados para o raio */}
                {Array.from({ length: 7 }).map((_, i) => {
                    // 7 ticks para 0, 20, 40, 60, 80, 100, 120 (approx)
                    const tickAngle = -180 + (i * (180 / 6));
                    return (
                        <g key={i} transform={`translate(${cx}, ${cy}) rotate(${tickAngle}) translate(${r + 18}, 0)`}>
                            <rect 
                                x={0} y={-1} 
                                width={6} height={2} 
                                fill="#4b5563" 
                            />
                        </g>
                    );
                })}

                {/* Active Arc - Fino e Elegante */}
                <path 
                    d={trackPath}
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${fillAmount} ${arcLength}`} 
                    className="transition-all duration-1000 ease-out opacity-80"
                />

                {/* Needle */}
                <g 
                    className="transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1)" // Easing com bounce leve
                    style={{ transform: `translate(${cx}px, ${cy}px) rotate(${rotation}deg)` }}
                >
                    {/* Ponteiro afilado e longo */}
                    <path 
                        d="M -4 0 L 0 -135 L 4 0 Z" 
                        fill={zoneColor} 
                        filter="url(#glow)"
                    />
                    {/* Base do ponteiro (Hub) */}
                    <circle cx="0" cy="0" r="6" fill="#fff" />
                    <circle cx="0" cy="0" r="12" stroke={zoneColor} strokeWidth="2" fill="none" opacity="0.6" />
                </g>

                {/* Labels Estáticos */}
                <text x={cx - r - 25} y={cy + 5} textAnchor="end" fill="#6b7280" fontSize="12" fontWeight="bold">0%</text>
                <text x={cx + r + 25} y={cy + 5} textAnchor="start" fill="#6b7280" fontSize="12" fontWeight="bold">100%</text>
            </svg>

            {/* Central Info - Reposicionado: FLUTUANDO ACIMA do centro */}
            <div className="absolute bottom-[65px] w-full text-center flex flex-col items-center pointer-events-none">
                <div className="flex items-baseline gap-1 relative mb-1">
                    <span 
                        className="text-8xl font-display font-bold text-white transition-colors duration-500 tracking-tighter drop-shadow-2xl"
                        style={{ textShadow: `0 0 30px ${glowColor}` }}
                    >
                        {Math.round(displayValue)}
                    </span>
                    <span className="text-gray-500 text-2xl font-medium relative -top-6">/ {target}</span>
                </div>
                
                <p className="text-neon-cyan/80 text-xs uppercase tracking-[0.2em] font-bold mb-2">{label}</p>
                
                {/* Status Badge */}
                <div className="mt-1">
                    {percentage >= 1.0 ? (
                        <span className="px-3 py-1 rounded bg-neon-purple/20 text-neon-purple border border-neon-purple/40 text-[10px] font-bold uppercase tracking-wide animate-pulse">
                            Overdrive
                        </span>
                    ) : percentage >= 0.75 ? (
                        <span className="px-3 py-1 rounded bg-neon-green/10 text-neon-green border border-neon-green/20 text-[10px] font-bold uppercase tracking-wide">
                            Zona Ideal
                        </span>
                    ) : percentage >= 0.25 ? (
                        <span className="px-3 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-bold uppercase tracking-wide">
                            Atenção
                        </span>
                    ) : (
                        <span className="px-3 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold uppercase tracking-wide">
                            Zona de Risco
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Gauge;