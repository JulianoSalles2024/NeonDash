import { create } from 'zustand';
import { User } from '../types';

export type SortKey = keyof User;
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface UsersViewState {
  searchTerm: string;
  sortConfig: SortConfig;
  currentPage: number;
  
  setSearchTerm: (term: string) => void;
  setSortConfig: (config: SortConfig) => void;
  setCurrentPage: (page: number) => void;
  resetView: () => void;
}

export const useUsersViewStore = create<UsersViewState>((set) => ({
  searchTerm: '',
  sortConfig: { key: 'healthScore', direction: 'desc' }, // Padrão: Risco/Saúde decrescente
  currentPage: 1,

  setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }), // Reseta para pág 1 ao buscar
  setSortConfig: (config) => set({ sortConfig: config }),
  setCurrentPage: (page) => set({ currentPage: page }),
  resetView: () => set({ searchTerm: '', sortConfig: { key: 'healthScore', direction: 'desc' }, currentPage: 1 })
}));