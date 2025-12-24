import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SnapshotData {
    globalScore: number;
    activeUsers: number;
    mrr: number;
    churn: number;
    timeframe: string;
    timestamp: string;
}

export interface Snapshot {
    id: string;
    name: string;
    note?: string;
    data: SnapshotData;
    createdAt: string;
}

interface SnapshotState {
    snapshots: Snapshot[];
    addSnapshot: (name: string, data: SnapshotData) => void;
    deleteSnapshot: (id: string) => void;
    restoreSnapshot: (id: string) => Snapshot | undefined;
}

export const useSnapshotStore = create<SnapshotState>()(
    persist(
        (set, get) => ({
            snapshots: [],
            
            addSnapshot: (name, data) => set((state) => ({
                snapshots: [
                    {
                        id: Date.now().toString(),
                        name,
                        data,
                        createdAt: new Date().toISOString() // ISO string for sorting/display
                    },
                    ...state.snapshots
                ]
            })),

            deleteSnapshot: (id) => set((state) => ({
                snapshots: state.snapshots.filter(s => s.id !== id)
            })),

            restoreSnapshot: (id) => {
                const snapshot = get().snapshots.find(s => s.id === id);
                return snapshot;
            }
        }),
        {
            name: 'neondash-snapshots', // key in localStorage
        }
    )
);