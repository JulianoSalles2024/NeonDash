import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, Toast as ToastType } from '../../store/useToastStore';

const TOAST_VARIANTS = {
    initial: { opacity: 0, x: 50, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2 } }
};

const ICONS = {
    success: <CheckCircle size={20} className="text-neon-green" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    warning: <AlertTriangle size={20} className="text-yellow-400" />,
    info: <Info size={20} className="text-neon-blue" />
};

const STYLES = {
    success: 'border-neon-green/30 bg-neon-green/5 shadow-[0_0_15px_rgba(52,255,176,0.1)]',
    error: 'border-red-500/30 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    warning: 'border-yellow-400/30 bg-yellow-400/5 shadow-[0_0_15px_rgba(250,204,21,0.1)]',
    info: 'border-neon-blue/30 bg-neon-blue/5 shadow-[0_0_15px_rgba(78,225,255,0.1)]'
};

const ToastItem: React.FC<{ toast: ToastType }> = ({ toast }) => {
    const removeToast = useToastStore(state => state.removeToast);

    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(toast.id);
        }, toast.duration || 4000);

        return () => clearTimeout(timer);
    }, [toast, removeToast]);

    return (
        <motion.div
            layout
            variants={TOAST_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`
                flex items-start gap-3 p-4 rounded-lg border backdrop-blur-md w-80 md:w-96 mb-3 relative overflow-hidden
                ${STYLES[toast.type]}
            `}
        >
            <div className="shrink-0 mt-0.5">{ICONS[toast.type]}</div>
            <div className="flex-1">
                <h4 className="text-sm font-bold text-white leading-tight">{toast.title}</h4>
                {toast.message && <p className="text-xs text-gray-300 mt-1 leading-snug">{toast.message}</p>}
            </div>
            <button 
                onClick={() => removeToast(toast.id)}
                className="text-gray-500 hover:text-white transition-colors p-1"
            >
                <X size={14} />
            </button>
            
            {/* Progress bar animation */}
            <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-0.5 ${
                    toast.type === 'success' ? 'bg-neon-green/50' : 
                    toast.type === 'error' ? 'bg-red-500/50' : 
                    toast.type === 'warning' ? 'bg-yellow-400/50' : 'bg-neon-blue/50'
                }`}
            />
        </motion.div>
    );
};

export const ToastContainer: React.FC = () => {
    const toasts = useToastStore(state => state.toasts);

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem toast={toast} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};