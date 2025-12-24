import { create } from 'zustand';

interface UIState {
  isMobileMenuOpen: boolean;
  isSidebarCollapsed: boolean;
  isSnapshotDrawerOpen: boolean;
  isCaptureModalOpen: boolean;
  
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  
  toggleSidebar: () => void;

  openSnapshotDrawer: () => void;
  closeSnapshotDrawer: () => void;
  
  openCaptureModal: () => void;
  closeCaptureModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSidebarCollapsed: false,
  isSnapshotDrawerOpen: false,
  isCaptureModalOpen: false,

  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  openSnapshotDrawer: () => set({ isSnapshotDrawerOpen: true }),
  closeSnapshotDrawer: () => set({ isSnapshotDrawerOpen: false }),

  openCaptureModal: () => set({ isCaptureModalOpen: true }),
  closeCaptureModal: () => set({ isCaptureModalOpen: false }),
}));