import React, { useState, useEffect, useRef } from 'react';
import { Play, RefreshCw, Send, Sparkles, Cpu, Zap, Coins, AlignLeft } from 'lucide-react';
import { Agent } from '../../types';
import { generateAgentChat } from '../../services/ai';
import { useToastStore } from '../../store/useToastStore';
import { useAgentStore } from '../../store/useAgentStore';
import { MODEL_REGISTRY } from '../../constants';

interface AgentPlaygroundProps {
    agent: Agent;
}

const AgentPlayground: React.FC<AgentPlaygroundProps> = ({ agent }) => {
    const { addToast } = useToastStore();
    const { recordUsage, addLog } = useAgentStore(); // Hook para salvar dados reais
    
    const [prompt, setPrompt] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Updated metrics state to include charCount
    const [metrics, setMetrics] = useState<{latency: number, tokens: number, cost: number, charCount: number} | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize/Reset
    useEffect(() => {
        setSystemPrompt(agent.systemPrompt || 'Você é um assistente útil.');
    }, [agent]);

    // Auto-scroll to bottom safely using requestAnimationFrame to avoid layout thrashing/freezes
    useEffect(() => {
        if (messages.length > 0) {
            requestAnimationFrame(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }, [messages]);

    const handleRun = async () => {
        if (isLoading || !prompt.trim()) return;

        const currentPrompt = prompt;
        const promptLength = currentPrompt.length; // Capture length before clearing
        const newUserMsg = { role: 'user' as const, content: currentPrompt };
        
        // Optimistic update
        setMessages(prev => [...prev, newUserMsg]);
        setPrompt(''); // Clear input immediately
        setIsLoading(true);
        setMetrics(null);

        const startTime = Date.now();

        try {
            // Call Real AI Service
            const response = await generateAgentChat(
                agent.model,
                systemPrompt,
                agent.temperature || 0.7,
                messages, // Pass history excluding new message
                currentPrompt
            );

            const endTime = Date.now();
            const latency = endTime - startTime;

            // Calculate estimated cost
            const pricing = MODEL_REGISTRY[agent.model] || { inputPrice: 0.50, outputPrice: 1.50 };
            
            const inputCost = (response.usage.promptTokens / 1000000) * pricing.inputPrice;
            const outputCost = (response.usage.responseTokens / 1000000) * pricing.outputPrice;
            const totalCost = inputCost + outputCost;

            setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
            
            // --- ATUALIZAÇÃO DOS DADOS REAIS ---
            const usageData = {
                tokens: response.usage.totalTokens,
                cost: totalCost,
                latency: latency,
                charCount: promptLength
            };

            setMetrics(usageData);

            // 1. Grava Métricas no Agente (Store + DB)
            await recordUsage(agent.id, {
                tokens: usageData.tokens,
                cost: usageData.cost,
                latency: usageData.latency,
                successful: true
            });

            // 2. Adiciona Log na Tabela
            addLog({
                id: Date.now().toString(),
                agentId: agent.id,
                timestamp: new Date().toLocaleTimeString(),
                input: currentPrompt,
                output: response.text,
                tokens: usageData.tokens,
                latency: usageData.latency,
                cost: parseFloat(usageData.cost.toFixed(6)),
                status: 'success',
                model: agent.model
            });

        } catch (error: any) {
            console.error(error);
            addToast({
                type: 'error',
                title: 'Erro de Execução',
                message: 'Falha ao obter resposta da IA. Verifique sua conexão ou API Key.'
            });
            setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Erro: Não foi possível processar sua solicitação." }]);
            
            // Registra log de erro
            addLog({
                id: Date.now().toString(),
                agentId: agent.id,
                timestamp: new Date().toLocaleTimeString(),
                input: currentPrompt,
                output: error.message || "Erro desconhecido",
                tokens: 0,
                latency: 0,
                cost: 0,
                status: 'error',
                model: agent.model
            });

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-[600px] bg-[#0B0F1A] border border-white/10 rounded-xl shadow-lg overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neon-cyan/20 rounded-lg text-neon-cyan">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white font-display">Simulador em Tempo Real</h3>
                        <p className="text-xs text-gray-400 font-mono flex items-center gap-2">
                            {MODEL_REGISTRY[agent.model]?.label || agent.model} • Temp: {agent.temperature || 0.7}
                            <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold">
                                LIVE API
                            </span>
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setMessages([])}
                    className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                    Limpar Chat
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Column: Configuration & Input */}
                <div className="w-1/3 border-r border-white/5 flex flex-col bg-[#080a12]">
                    <div className="p-4 border-b border-white/5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">System Prompt (Contexto)</label>
                        <textarea 
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="w-full h-40 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-gray-300 focus:border-neon-cyan focus:outline-none font-mono resize-none"
                            placeholder="Instruções do sistema..."
                        />
                    </div>
                    <div className="flex-1 p-4 flex flex-col relative">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Input do Usuário</label>
                        <div className="relative flex-1 mb-4">
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-neon-cyan focus:outline-none resize-none pb-8" 
                                placeholder="Digite seu prompt de teste aqui..."
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleRun();
                                    }
                                }}
                            />
                            {/* Live Character Counter */}
                            <div className="absolute bottom-2 right-3 text-[10px] text-gray-500 font-mono pointer-events-none bg-black/50 px-1 rounded">
                                {prompt.length} caracteres
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleRun}
                            disabled={isLoading || !prompt.trim()}
                            className={`
                                w-full py-3 rounded-lg font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2
                                transition-all duration-200
                                ${isLoading || !prompt.trim() ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-neon-cyan text-dark-bg hover:bg-neon-blue shadow-[0_0_15px_rgba(124,252,243,0.3)]'}
                            `}
                        >
                            {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                            {isLoading ? 'Gerando...' : 'Executar'}
                        </button>
                    </div>
                </div>

                {/* Right Column: Output & Metrics */}
                <div className="w-2/3 flex flex-col bg-[#0B0F1A] relative">
                        {/* Metrics Overlay */}
                        {metrics && (
                        <div className="absolute top-4 right-4 flex gap-3 z-10 animate-in slide-in-from-top-2 fade-in">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white font-mono backdrop-blur-md shadow-lg">
                                <AlignLeft size={12} className="text-gray-300" /> 
                                <span className="font-bold text-neon-cyan">{metrics.charCount}</span> chars
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-purple/10 border border-neon-purple/30 rounded-lg text-xs text-neon-purple font-mono backdrop-blur-md">
                                <Cpu size={12} /> {metrics.tokens} toks
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-blue/10 border border-neon-blue/30 rounded-lg text-xs text-neon-blue font-mono backdrop-blur-md">
                                <Zap size={12} /> {metrics.latency}ms
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 border border-neon-green/30 rounded-lg text-xs text-neon-green font-mono backdrop-blur-md">
                                <Coins size={12} /> ${metrics.cost.toFixed(6)}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                <Send size={48} className="mb-4 opacity-20" />
                                <p>O chat está vazio. Execute um prompt para começar.</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed
                                        ${msg.role === 'user' 
                                            ? 'bg-white/10 text-white rounded-br-none' 
                                            : 'bg-gradient-to-br from-neon-blue/10 to-neon-purple/5 border border-white/5 text-gray-200 rounded-bl-none shadow-lg'}
                                    `}>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 rounded-2xl p-4 rounded-bl-none flex gap-2 items-center">
                                    <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentPlayground;