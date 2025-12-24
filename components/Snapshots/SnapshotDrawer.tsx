import React from 'react';
import { X, Clock, Trash2, RotateCcw, Activity } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useSnapshotStore, Snapshot } from '../../store/useSnapshotStore';
import { useToastStore } from '../../store/useToastStore';

interface SnapshotCardProps {
    snapshot: Snapshot;
    onDelete: () => void;
    onRestore: () => void;
}

const SnapshotCard: React.FC<SnapshotCardProps> = ({ snapshot, onDelete, onRestore }) => (
    <div className="group relative bg-white/[0.03] border border-white/5 hover:border-neon-cyan/30 rounded-xl p-4 transition-all duration-300 hover:bg-white/[0.05]">
        <div className="flex justify-between items-start mb-3">
            <div>
                <h4 className="font-bold text-white text-sm line-clamp-1 pr-4">{snapshot.name}</h4>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock size={10} /> {new Date(snapshot.createdAt).toLocaleDateString()} • {new Date(snapshot.createdAt).toLocaleTimeString()}
                </p>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Excluir"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-black/20 rounded p-2 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase">Score</p>
                <p className="text-lg font-mono font-bold text-neon-cyan">{snapshot.data.globalScore}</p>
            </div>
            <div className="bg-black/20 rounded p-2 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase">Churn</p>
                <p className="text-lg font-mono font-bold text-white">{snapshot.data.churn}%</p>
            </div>
        </div>

        <button 
            onClick={onRestore}
            className="w-full py-2 bg-white/5 border border-white/10 rounded text-xs font-bold text-gray-300 uppercase tracking-wider hover:bg-neon-cyan/10 hover:text-neon-cyan hover:border-neon-cyan/20 transition-all flex items-center justify-center gap-2"
        >
            <RotateCcw size={12} /> Restaurar Visão
        </button>
    </div>
);

const SnapshotDrawer: React.FC = () => {
    const { isSnapshotDrawerOpen, closeSnapshotDrawer } = useUIStore();
    const { snapshots, deleteSnapshot } = useSnapshotStore();
    const { addToast } = useToastStore();

    const handleRestore = (id: string) => {
        // In a real app, this would dispatch actions to replace the store state.
        // Here we simulate the feedback loop.
        addToast({
            type: 'info',
            title: 'Visão Restaurada',
            message: 'O painel foi revertido para o estado deste snapshot. (Simulação)',
            duration: 3000
        });
        closeSnapshotDrawer();
    };

    return (
        <>
            {/* Backdrop */}
            {isSnapshotDrawerOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
                    onClick={closeSnapshotDrawer}
                />
            )}

            {/* Drawer */}
            <div className={`
                fixed inset-y-0 right-0 z-[55] w-full md:w-96 bg-[#0B0F1A] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col
                ${isSnapshotDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                        <Activity className="text-neon-cyan" size={20} /> Galeria de Snapshots
                    </h2>
                    <button onClick={closeSnapshotDrawer} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {snapshots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center opacity-50">
                            <Clock size={48} className="mb-4 text-gray-600" />
                            <p className="text-sm text-gray-400">Nenhum snapshot salvo.</p>
                            <p className="text-xs text-gray-600 mt-1">Capture o estado atual usando o ícone de câmera no topo.</p>
                        </div>
                    ) : (
                        snapshots.map((snap) => (
                            <SnapshotCard 
                                key={snap.id} 
                                snapshot={snap} 
                                onDelete={() => deleteSnapshot(snap.id)}
                                onRestore={() => handleRestore(snap.id)}
                            />
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                    <p className="text-xs text-center text-gray-500">
                        Snapshots são salvos localmente no seu navegador.
                    </p>
                </div>
            </div>
        </>
    );
};

export default SnapshotDrawer;