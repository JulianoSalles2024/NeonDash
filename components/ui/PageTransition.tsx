import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children?: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} // smooth ease-out
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;