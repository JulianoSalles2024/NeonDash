
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  CreditCard, 
  Settings, 
  PieChart,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  Bot,
  Network
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';

const NavItem = ({ icon: Icon, label, to, active, collapsed, onClick }: { icon: any, label: string, to: string, active: boolean, collapsed: boolean, onClick?: () => void }) => (
  <Link 
    to={to} 
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`
      flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 group relative overflow-hidden
      ${active 
        ? 'bg-neon-cyan/10 text-neon-cyan border-r-2 border-neon-cyan' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'}
      ${collapsed ? 'justify-center' : ''}
    `}
  >
    <Icon size={20} className={`shrink-0 transition-colors ${active ? 'text-neon-cyan' : 'group-hover:text-neon-blue'}`} />
    
    {/* Text Label - Hidden when collapsed */}
    <span className={`font-medium tracking-wide text-sm whitespace-nowrap transition-all duration-300 ${collapsed ? 'opacity-0 w-0 translate-x-10 absolute' : 'opacity-100 w-auto translate-x-0 relative'}`}>
        {label}
    </span>
  </Link>
);

const SectionTitle = ({ label, collapsed }: { label: string, collapsed: boolean }) => (
    <p className={`
        px-4 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 transition-all duration-300 whitespace-nowrap overflow-hidden
        ${collapsed ? 'opacity-0 h-0 mb-0' : 'opacity-100 h-auto'}
    `}>
        {label}
    </p>
);

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isMobileMenuOpen, closeMobileMenu, isSidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 h-screen bg-dark-bg border-r border-white/5 flex flex-col z-[100] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${isMobileMenuOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : '-translate-x-full'}
          md:translate-x-0
          ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'} border-b border-white/5 bg-dark-bg/50 backdrop-blur-xl transition-all duration-300`}>
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(78,225,255,0.4)]">
              <Activity size={18} className="text-white" />
            </div>
            <span className={`ml-3 font-display font-bold text-xl tracking-wider text-white whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
              NEON<span className="text-neon-cyan">DASH</span>
            </span>
          </div>
          
          {/* Close Button (Mobile Only) */}
          <button 
            onClick={closeMobileMenu}
            className="md:hidden text-gray-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop Toggle Button (New) */}
        <div className="hidden md:flex justify-end px-2 py-2">
            <button 
                onClick={toggleSidebar}
                className={`
                    p-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-gray-500 hover:text-neon-cyan hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all
                    ${isSidebarCollapsed ? 'mx-auto' : ''}
                `}
                title={isSidebarCollapsed ? "Expandir" : "Minimizar"}
            >
                {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 md:p-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="mb-6">
            <SectionTitle label="Plataforma" collapsed={isSidebarCollapsed} />
            <NavItem icon={LayoutDashboard} label="Mission Control" to="/" active={location.pathname === '/'} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
            <NavItem icon={Activity} label="Motor de Saúde" to="/health" active={location.pathname === '/health'} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
          </div>

          <div className="mb-6">
            <SectionTitle label="Crescimento" collapsed={isSidebarCollapsed} />
            <NavItem icon={Users} label="Usuários" to="/users" active={location.pathname === '/users'} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
            <NavItem icon={Bot} label="Agentes" to="/agents" active={location.pathname === '/agents'} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
            <NavItem icon={PieChart} label="Retenção" to="/retention" active={location.pathname === '/retention'} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
            <NavItem icon={CreditCard} label="Créditos e Fatura" to="/billing" active={location.pathname === '/billing'} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
          </div>

          <div>
            <SectionTitle label="Sistema" collapsed={isSidebarCollapsed} />
            <NavItem icon={Network} label="Integrações" to="/integrations" active={location.pathname === '/integrations'} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
            <NavItem icon={Settings} label="Configurações" to="/settings" active={location.pathname === '/settings'} collapsed={isSidebarCollapsed} onClick={closeMobileMenu} />
          </div>
        </nav>

        {/* Footer User Profile */}
        <div className="p-4 border-t border-white/5 bg-black/10 overflow-hidden">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-2 transition-all duration-300`}>
            <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=random`} alt="Admin" className="w-8 h-8 rounded-full border border-white/20 shrink-0" />
            
            <div className={`flex-1 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'Acesso Restrito'}</p>
            </div>
            
            <button 
              onClick={logout}
              title="Sair do sistema"
              className={`text-gray-500 hover:text-red-400 transition-colors ${isSidebarCollapsed ? 'hidden' : 'block'}`}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
