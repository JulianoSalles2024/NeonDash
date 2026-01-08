import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/useAuthStore';
import { useUserStore } from './store/useUserStore';
import { useAgentStore } from './store/useAgentStore';
import ProtectedLayout from './components/Layout/ProtectedLayout';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users';
import AgentsPage from './pages/Agents';
import AgentProfile from './pages/AgentProfile';
import UserProfile from './pages/UserProfile';
import HealthEngine from './pages/HealthEngine';
import Retention from './pages/Retention';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Integrations from './pages/Integrations';
import Login from './pages/Login';
import Register from './pages/Register';
import { ToastContainer } from './components/ui/Toast';
import CaptureModal from './components/Snapshots/CaptureModal';
import SnapshotDrawer from './components/Snapshots/SnapshotDrawer';

const App: React.FC = () => {
  const location = useLocation();
  const { setUser, setIsCheckingAuth } = useAuthStore();
  const { fetchUsers } = useUserStore();
  const { fetchAgents } = useAgentStore();

  useEffect(() => {
    // 1. Verificar sessão atual ao carregar
    const initSession = async () => {
        setIsCheckingAuth(true);
        try {
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
                console.warn("Erro ao verificar sessão (possível falta de configuração):", error.message);
                setUser(null);
                return;
            }

            if (data?.session?.user) {
                setUser({
                    id: data.session.user.id,
                    email: data.session.user.email!,
                    name: data.session.user.user_metadata.name || 'Admin',
                    company: data.session.user.user_metadata.company || 'Neon HQ',
                    role: data.session.user.user_metadata.role || 'admin'
                });
                // Carregar dados iniciais em background
                fetchUsers();
                fetchAgents();
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error("Falha crítica na inicialização:", err);
            setUser(null);
        } finally {
            setIsCheckingAuth(false);
        }
    };

    initSession();

    // 2. Ouvir mudanças de auth (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || 'Admin',
          company: session.user.user_metadata.company || 'Neon HQ',
          role: session.user.user_metadata.role || 'admin'
        });
        setIsCheckingAuth(false);
      } else {
        setUser(null);
        // Não setamos isCheckingAuth=false aqui imediatamente para evitar redirects
        // durante o refresh, mas o initSession garante o estado inicial.
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setIsCheckingAuth, fetchUsers, fetchAgents]);

  return (
    <>
      {/* Global Notifications */}
      <ToastContainer />
      
      {/* Global Modals & Drawers */}
      <CaptureModal />
      <SnapshotDrawer />
      
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/health" element={<HealthEngine />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserProfile />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/agents/:id" element={<AgentProfile />} />
            <Route path="/retention" element={<Retention />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default App;