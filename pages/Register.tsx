import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, User, Building, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
        register(email, name, company);
        
        addToast({
            type: 'success',
            title: 'Credencial Criada',
            message: 'Cadastro realizado com sucesso. Faça login para acessar.',
            duration: 3000
        });
        
        navigate('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#05080f] flex items-center justify-center relative overflow-hidden">
        
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[120px] opacity-20 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[120px] opacity-20 animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
            <div 
                className="absolute inset-0 opacity-[0.03]" 
                style={{ 
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                }}
            ></div>
        </div>

        <motion.div 
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md px-4"
        >
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                
                {/* Scanner Line Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-50 animate-glow"></div>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-neon-green to-neon-blue rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(52,255,176,0.3)]">
                        <UserPlus size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-white tracking-wider mb-2">Solicitar Acesso</h1>
                    <p className="text-gray-500 text-xs tracking-widest uppercase">Novo Cadastro de Operador</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2 group/input">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within/input:text-neon-green transition-colors">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-gray-500 group-focus-within/input:text-white transition-colors" size={18} />
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/50 transition-all"
                                placeholder="Ex: João Silva"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group/input">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within/input:text-neon-green transition-colors">Empresa</label>
                        <div className="relative">
                            <Building className="absolute left-4 top-3.5 text-gray-500 group-focus-within/input:text-white transition-colors" size={18} />
                            <input 
                                type="text" 
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/50 transition-all"
                                placeholder="Ex: Startup Inc"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group/input">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within/input:text-neon-green transition-colors">Email Corporativo</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-gray-500 group-focus-within/input:text-white transition-colors" size={18} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/50 transition-all"
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
                            flex items-center justify-center gap-2 relative overflow-hidden mt-4
                            transition-all duration-300
                            ${isLoading ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-neon-green text-dark-bg hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'}
                        `}
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></span>
                                Processando...
                            </>
                        ) : (
                            <>
                                Criar Credencial <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 group">
                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Já possui acesso? <span className="text-neon-cyan font-bold">Fazer Login</span>
                    </Link>
                </div>
            </div>
            
            {/* Footer */}
            <p className="text-center text-xs text-gray-600 mt-8 font-mono">
                NEONDASH SECURE REGISTRY // V2.4.0
            </p>
        </motion.div>
    </div>
  );
};

export default Register;