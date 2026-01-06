
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRBAC } from '../../hooks/useRBAC';
import { Permission } from '../../types';
import { useToastStore } from '../../store/useToastStore';

interface RBACRouteProps {
  permission: Permission;
  children: React.ReactNode;
}

const RBACRoute: React.FC<RBACRouteProps> = ({ permission, children }) => {
  const { hasPermission } = useRBAC();
  const { addToast } = useToastStore();

  if (!hasPermission(permission)) {
    // Optional: Show toast only once to avoid spam on redirects
    // addToast({ type: 'error', title: 'Acesso Negado', message: 'Você não tem permissão para acessar esta página.' });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RBACRoute;
