import React, { useState, useEffect, useRef } from 'react';
import { Play, RefreshCw, Send, Sparkles, Cpu, Zap, Coins, Trash2 } from 'lucide-react';
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
    const { recordUsage, addLog } = useAgentStore();
    
    const [prompt, setPrompt] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Refs for auto-scroll
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load System Prompt
    useEffect(() => {
        setSystemPrompt(agent.systemPrompt || 'Você é um assistente útil.');
    }, [agent.id, agent.systemPrompt]);

    // Scroll behavior
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleRun = async () => {
        if (!prompt.trim()) return;

        const currentPrompt = prompt;
        
        // 1. Add User Message immediately
        const newUserMsg = { role: 'user' as const, content: currentPrompt };
        const historyForAI = [...messages]; // Snapshot current history
        
        setMessages(prev => [...prev, newUserMsg]);
        setPrompt(''); // Clear input
        setIsLoading(true);

        const startTime = Date.now();

        try {
            // 2. Call AI Service
            const response = await generateAgentChat(
                agent.model,
                systemPrompt,
                agent.temperature || 0.7,
                historyForAI, 
                currentPrompt
            );

            const endTime = Date.now();
            const latency = endTime - startTime;

            // 3. Calculate Costs
            const pricing = MODEL_REGISTRY[agent.model] || { inputPrice: 0.50, outputPrice: 1.50 };
            const inputCost = (response.usage.promptTokens || 0) / 1000000 * pricing.inputPrice;
            const outputCost = (response.usage.responseTokens || 0) / 1000000 * pricing.outputPrice;
            const totalCost = inputCost + outputCost;

            // 4. Update UI with Response
            setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);

            // 5. Background Stats Update
            recordUsage(agent.id, {
                tokens: response.usage.totalTokens,
                cost: totalCost,
                latency: latency,
                successful: true
            });

            addLog({
                id: Date.now().toString(),
                agentId: agent.id,
                timestamp: new Date().toLocaleTimeString(),
                input: currentPrompt,
                output: response.text,
                tokens: response.usage.totalTokens,
                latency: latency,
                cost: parseFloat(totalCost.toFixed(6)),
                status: 'success',
                model: agent.model
            });

        } catch (error: any) {
            console.error("Agent Error:", error);
            const errorMessage = error.message || "Erro desconhecido na execução do agente.";
            
            addToast({
                type: 'error',
                title: 'Falha na Execução',
                message: errorMessage
            });
            
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errorMessage}` }]);
            
            addLog({
                id: Date.now().toString(),
                agentId: agent.id,
                timestamp: new Date().toLocaleTimeString(),
                input: currentPrompt,
                output: errorMessage,
                tokens: 0,
                latency: Date.now() - startTime,
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
                                LIVE
                            </span>
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setMessages([])}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded hover:bg-white/5"
                >
                    <Trash2 size={14} /> Limpar Chat
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Column: Configuration & Input */}
                <div className="w-1/3 border-r border-white/5 flex flex-col bg-[#080a12]">
                    <div className="p-4 border-b border-white/5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                            <Cpu size={12} /> System Prompt (Contexto)
                        </label>
                        <textarea 
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="w-full h-40 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-gray-300 focus:border-neon-cyan focus:outline-none font-mono resize-none leading-relaxed"
                            placeholder="Defina como o agente deve se comportar..."
                        />
                    </div>
                    <div className="flex-1 p-4 flex flex-col relative">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                            <Zap size={12} /> Input do Usuário
                        </label>
                        <div className="relative flex-1 mb-4">
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-neon-cyan focus:outline-none resize-none pb-8 placeholder-gray-600" 
                                placeholder="Digite sua mensagem para testar o agente..."
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleRun();
                                    }
                                }}
                            />
                            <div className="absolute bottom-2 right-3 text-[10px] text-gray-600 font-mono pointer-events-none">
                                {prompt.length} chars
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
                            {isLoading ? 'Processando...' : 'Executar'}
                        </button>
                    </div>
                </div>

                {/* Right Column: Chat Output */}
                <div className="w-2/3 flex flex-col bg-[#0B0F1A] relative">
                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                <div className="p-4 rounded-full bg-white/5 mb-4">
                                    <Send size={32} className="opacity-50" />
                                </div>
                                <p className="font-medium">O chat está vazio.</p>
                                <p className="text-sm opacity-60">Envie um prompt para iniciar a simulação.</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg
                                        ${msg.role === 'user' 
                                            ? 'bg-white/10 text-white rounded-br-none border border-white/5' 
                                            : 'bg-gradient-to-br from-neon-blue/10 to-neon-purple/5 border border-white/10 text-gray-200 rounded-bl-none'}
                                    `}>
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-2 mb-2 text-[10px] text-neon-cyan uppercase tracking-wider font-bold opacity-70">
                                                <Sparkles size={10} /> Resposta do Agente
                                            </div>
                                        )}
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