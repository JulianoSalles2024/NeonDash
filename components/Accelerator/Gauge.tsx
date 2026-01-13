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
    const cy = 170; // Centro elevado
    const r = 130;  // Raio reduzido para caber com folga
    const startAngle = -180;
    const endAngle = 0;
    const totalAngle = endAngle - startAngle;
    
    // Rotação do Ponteiro
    // Mapeia 0 -> 1.2 (percentage) para -180 -> 36 (se for linear alem de 100%)
    // Vamos limitar visualmente o ponteiro a 180 graus (0 a 100%) ou deixar passar um pouco?
    // Referencia visual: 120% max. 
    // 100% = 0 deg (right). 120% = +36 deg (below horizon right).
    // Para manter elegancia, vamos mapear 0-120% dentro do arco de 180? 
    // Não, velocimetro real: 0% = esquerda, 100% = direita.
    // Vamos usar escala 0 a 120% mapeada em 220 graus? 
    // O pedido é "arco mais fino... desenho mais aberto". 
    // Vamos usar Semi-Circulo Estrito (-180 a 0) onde 100% é o fim. 120% vai passar um pouco (overdrive).
    const rotation = startAngle + (180 * Math.min(percentage, 1.2)); // Mapeia 0-100% em 180 graus. Se > 100, vai descendo.

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
    // M (cx-r) cy A r r 0 1 1 (cx+r) cy
    const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;

    // Calculo do Dasharray para o arco ativo
    // Perímetro do semicirculo = PI * r
    const arcLength = Math.PI * r;
    // O quanto preencher: percentage (max 1.0 para o arco visual, ou deixa ir até 1.2 se quiser)
    // Se o arco é fixo 180 graus, visualmente ele enche até 100%.
    const fillAmount = Math.min(percentage, 1) * arcLength;

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-end">
            <svg viewBox="0 0 400 220" className="w-full h-full overflow-visible">
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
                    strokeWidth="10" 
                    strokeLinecap="round"
                />

                {/* Ticks - Ajustados para o raio */}
                {Array.from({ length: 7 }).map((_, i) => {
                    // 7 ticks para 0, 20, 40, 60, 80, 100, 120 (approx)
                    // Distribuidos em 180 graus
                    const tickAngle = -180 + (i * (180 / 6));
                    return (
                        <g key={i} transform={`translate(${cx}, ${cy}) rotate(${tickAngle}) translate(${r + 15}, 0)`}>
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
                    strokeWidth="10"
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
                        d="M -4 0 L 0 -125 L 4 0 Z" 
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
            {/* Ajuste de bottom para descolar do eixo do ponteiro (cy=170 no svg de 220h -> 50px do bottom + offset) */}
            <div className="absolute bottom-[60px] w-full text-center flex flex-col items-center pointer-events-none">
                <div className="flex items-baseline gap-1 relative mb-1">
                    <span 
                        className="text-7xl font-display font-bold text-white transition-colors duration-500 tracking-tighter drop-shadow-2xl"
                        style={{ textShadow: `0 0 30px ${glowColor}` }}
                    >
                        {Math.round(displayValue)}
                    </span>
                    <span className="text-gray-500 text-xl font-medium relative -top-5">/ {target}</span>
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
