
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
