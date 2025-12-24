import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Mail, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay for effect
    setTimeout(() => {
        if (email) {
            login(email);
            addToast({
                type: 'success',
                title: 'Acesso Autorizado',
                message: 'Bem-vindo de volta ao Mission Control.',
                duration: 3000
            });
            navigate('/');
        } else {
            addToast({
                type: 'error',
                title: 'Erro de Validação',
                message: 'Por favor, insira um email válido.',
            });
            setIsLoading(false);
        }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#05080f] flex items-center justify-center relative overflow-hidden">
        
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px] opacity-20 animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-cyan/20 rounded-full blur-[120px] opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            {/* Grid Overlay */}
            <div 
                className="absolute inset-0 opacity-[0.03]" 
                style={{ 
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                }}
            ></div>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md px-4"
        >
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                
                {/* Scanner Line Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50 animate-glow"></div>

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(78,225,255,0.3)]">
                        <Activity size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-wider mb-2">NEON<span className="text-neon-cyan">DASH</span></h1>
                    <p className="text-gray-500 text-sm tracking-widest uppercase">Identificação Requerida</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2 group/input">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within/input:text-neon-cyan transition-colors">Email Corporativo</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-gray-500 group-focus-within/input:text-white transition-colors" size={18} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all"
                                placeholder="nome@empresa.com"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className={`
                            w-full py-4 rounded-lg font-bold font-display uppercase tracking-wider text-sm
                            flex items-center justify-center gap-2 relative overflow-hidden
                            transition-all duration-300
                            ${isLoading ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-neon-cyan text-dark-bg hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'}
                        `}
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                                Autenticando...
                            </>
                        ) : (
                            <>
                                Acessar Sistema <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <Link to="/register" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 group">
                        <UserPlus size={14} className="group-hover:text-neon-cyan transition-colors" />
                        Ainda não tem acesso? <span className="text-neon-cyan font-bold">Solicitar Credencial</span>
                    </Link>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-600 flex items-center justify-center gap-2">
                        <ShieldCheck size={14} /> Conexão segura 256-bit TLS
                    </p>
                </div>
            </div>
            
            {/* Footer */}
            <p className="text-center text-xs text-gray-600 mt-8 font-mono">
                SYSTEM VERSION 2.4.0 // UNAUTHORIZED ACCESS PROHIBITED
            </p>
        </motion.div>
    </div>
  );
};

export default Login;