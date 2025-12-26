import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isCheckingAuth } = useAuthStore();
  const { isSidebarCollapsed } = useUIStore();

  // Enquanto verifica a sessão, mostramos um loader elegante para não piscar a tela de login
  if (isCheckingAuth) {
      return (
          <div className="min-h-screen bg-[#05080f] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 text-xs tracking-widest uppercase animate-pulse">Autenticando...</p>
              </div>
          </div>
      );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-dark-bg text-white font-sans selection:bg-neon-cyan/30 selection:text-neon-cyan overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />
      
        {/* Main Content Area */}
        <main 
            className={`
                flex-1 flex flex-col relative h-screen overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
            `}
        >
            <TopBar />
            
            <div className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth">
                <Outlet />
            </div>
        </main>
    </div>
  );
};

export default ProtectedLayout;