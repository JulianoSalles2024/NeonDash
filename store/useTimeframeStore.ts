import { create } from 'zustand';

export type Timeframe = '1h' | '24h' | '7d' | '30d';

interface TimeframeState {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
}

export const useTimeframeStore = create<TimeframeState>((set) => ({
  timeframe: '24h', // Default
  setTimeframe: (timeframe) => set({ timeframe }),
}));