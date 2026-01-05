import { create } from 'zustand';
import { StreamEvent } from '../types';

interface EventState {
  events: StreamEvent[];
  addEvent: (event: Omit<StreamEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  
  addEvent: (eventData) => {
    const newEvent: StreamEvent = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ...eventData
    };

    set((state) => ({
        // Mantém os últimos 50 eventos, novos no topo
        events: [newEvent, ...state.events].slice(0, 50)
    }));
  },

  clearEvents: () => set({ events: [] })
}));