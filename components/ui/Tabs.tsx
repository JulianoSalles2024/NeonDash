import React, { createContext, useContext, useState } from 'react';
import { motion } from 'framer-motion';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex border-b border-white/10 mb-6 relative ${className}`}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, icon }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.activeTab === value;

  return (
    <button
      onClick={() => context.setActiveTab(value)}
      className={`
        relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors duration-300
        ${isActive ? 'text-neon-cyan' : 'text-gray-500 hover:text-gray-300'}
      `}
    >
      {icon && <span className={isActive ? 'text-neon-cyan' : 'text-gray-500'}>{icon}</span>}
      {children}
      
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan shadow-[0_-2px_10px_rgba(124,252,243,0.5)]"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, children }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.activeTab !== value) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      // 'exit' prop REMOVED to prevent freezing bug
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};