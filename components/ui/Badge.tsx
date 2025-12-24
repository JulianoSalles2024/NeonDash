import React from 'react';
import { UserStatus } from '../../types';

interface BadgeProps {
  status: UserStatus;
}

const Badge: React.FC<BadgeProps> = ({ status }) => {
  let styles = '';
  
  switch (status) {
    case UserStatus.ACTIVE:
      styles = 'bg-neon-green/10 text-neon-green border-neon-green/30';
      break;
    case UserStatus.RISK:
      styles = 'bg-red-500/10 text-red-400 border-red-500/30';
      break;
    case UserStatus.CHURNED:
      styles = 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      break;
    case UserStatus.GHOST:
      styles = 'bg-neon-purple/10 text-neon-purple border-neon-purple/30';
      break;
    default:
      styles = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles} uppercase tracking-wider`}>
      {status}
    </span>
  );
};

export default Badge;