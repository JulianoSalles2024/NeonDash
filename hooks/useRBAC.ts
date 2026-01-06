
import { useAuthStore } from '../store/useAuthStore';
import { ROLES_CONFIG } from '../constants';
import { Permission, Role } from '../types';

export const useRBAC = () => {
  const { user } = useAuthStore();
  const role: Role = user?.role || 'viewer'; // Default to viewer if no role found

  const hasPermission = (permission: Permission): boolean => {
    // Admin always has all permissions implicitly, but explicit check is safer
    if (role === 'admin') return true;
    
    const allowedPermissions = ROLES_CONFIG[role] || [];
    return allowedPermissions.includes(permission);
  };

  const hasRole = (targetRole: Role | Role[]): boolean => {
    if (Array.isArray(targetRole)) {
        return targetRole.includes(role);
    }
    return role === targetRole;
  };

  return { role, hasPermission, hasRole };
};
