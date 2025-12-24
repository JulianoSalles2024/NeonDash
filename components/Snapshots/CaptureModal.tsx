import React, { useState } from 'react';
import { X, Camera, Save } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useSnapshotStore } from '../../store/useSnapshotStore';
import { useHealthStore } from '../../store/useHealthStore';
import { useTimeframeStore } from '../../store/useTimeframeStore';
import { useToastStore } from '../../store/useToastStore';

const CaptureModal: React.FC = () => {
    const { isCaptureModalOpen, closeCaptureModal, openSnapshotDrawer } = useUIStore();
    const { addSnapshot } = useSnapshotStore();
    const { addToast } = useToastStore();
    
    // Get current state from other stores to "freeze"
    const { globalScore } = useHealthStore();
    const { timeframe } = useTimeframeStore();

    const [name, setName] = useState('');

    if (!isCaptureModalOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Mock data capture - in a real app, you'd grab this from the relevant stores or query cache
        const snapshotData = {
            globalScore,
            activeUsers: Math.floor(Math.random() * 2000) + 1000, // Mock current value
            mrr: 142500, // Mock current value
            churn: 0.8, // Mock current value
            timeframe,
            timestamp: new Date().toLocaleString()
        };

        addSnapshot(name || `Snapshot #${Math.floor(Math.random() * 1000)}`, snapshotData);
        
        addToast({
            type: 'success',
            title: 'Snapshot Capturado',
            message: 'O estado atual foi salvo na galeria.'
        });

        setName('');
        closeCaptureModal();
        // Optional: Open drawer to show the new item
        setTimeout(() => openSnapshotDrawer(), 300);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#111625] border border-neon-cyan/30 rounded-xl shadow-[0_0_40px_rgba(124,252,243,0.1)] overflow-hidden transform transition-all">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-neon-cyan/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-neon-cyan/20 rounded-lg text-neon-cyan">
                            <Camera size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white font-display">
                            Capturar Estado
                        </h3>
                    </div>
                    <button onClick={closeCaptureModal} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="bg-white/[0.03] p-4 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Resumo da Captura</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-400 text-xs">Health Score</p>
                                <p className="text-xl font-mono text-neon-cyan font-bold">{globalScore}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs">Timeframe</p>
                                <p className="text-xl font-mono text-white font-bold uppercase">{timeframe}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Nome do Snapshot</label>
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="Ex: Pico de Vendas Black Friday" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan focus:outline-none transition-all"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={closeCaptureModal}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-neon-cyan text-dark-bg font-bold rounded-lg text-sm hover:bg-neon-blue transition-all flex items-center gap-2 shadow-lg shadow-neon-cyan/20"
                        >
                            <Save size={16} /> Salvar Snapshot
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CaptureModal;