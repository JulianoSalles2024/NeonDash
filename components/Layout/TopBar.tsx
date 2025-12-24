import React from 'react';
import { Search, Bell, Share2, Menu, Camera, History } from 'lucide-react';
import { useTimeframeStore, Timeframe } from '../../store/useTimeframeStore';
import { useUIStore } from '../../store/useUIStore';

const TopBar: React.FC = () => {
  const { timeframe, setTimeframe } = useTimeframeStore();
  const { toggleMobileMenu, openCaptureModal, openSnapshotDrawer } = useUIStore();
  const timeframes: Timeframe[] = ['1h', '24h', '7d', '30d'];

  return (
    <header className="h-16 border-b border-white/5 bg-dark-bg/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 md:px-8">
      
      {/* Left Section: Menu Toggle (Mobile) & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleMobileMenu}
          className="p-2 -ml-2 text-gray-400 hover:text-white md:hidden transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="relative w-full max-w-sm hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar usuários, eventos ou métricas (Cmd+K)" 
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-4 py-1.5 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-neon-cyan focus:border-transparent transition-all"
          />
        </div>
        {/* Mobile Search Icon */}
        <button className="md:hidden text-gray-400">
            <Search size={20} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Timeframe Selector */}
        <div className="hidden md:flex items-center bg-white/[0.03] rounded-lg border border-white/5 p-1">
            {timeframes.map((time) => (
                <button 
                    key={time}
                    onClick={() => setTimeframe(time)}
                    className={`
                        px-3 py-1 text-xs font-medium rounded-md transition-all 
                        ${timeframe === time 
                            ? 'bg-white/10 text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
                    `}
                >
                    {time}
                </button>
            ))}
        </div>

        <div className="hidden md:block h-6 w-px bg-white/10 mx-2"></div>

        {/* Snapshot Actions */}
        <div className="flex items-center gap-1">
            <button 
                onClick={openCaptureModal}
                className="p-2 text-neon-cyan hover:text-white hover:bg-neon-cyan/20 transition-all rounded-full border border-transparent hover:border-neon-cyan/30 group relative"
                title="Capturar Snapshot"
            >
                <Camera size={20} />
            </button>
            <button 
                onClick={openSnapshotDrawer}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all rounded-full"
                title="Galeria de Snapshots"
            >
                <History size={20} />
            </button>
        </div>

        <div className="hidden md:block h-6 w-px bg-white/10 mx-2"></div>

        <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-neon-pink rounded-full shadow-[0_0_8px_#FF4ECF]"></span>
        </button>

        <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5 hidden md:block">
            <Share2 size={20} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;