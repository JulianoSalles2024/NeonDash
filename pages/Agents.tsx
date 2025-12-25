import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import { Agent, AgentStatus } from '../types';
import { useAgentStore } from '../store/useAgentStore';
import { Plus, Edit2, Trash2, X, Check, Search, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Bot, Zap, Cpu, Activity, Coins, Tag } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';
import { useNavigate } from 'react-router-dom';
import { MODEL_REGISTRY } from '../constants';

type SortKey = keyof Agent;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const AgentsPage: React.FC = () => {
  const { addToast } = useToastStore();
  const { agents, addAgent, updateAgent, deleteAgent } = useAgentStore();
  const navigate = useNavigate();

  // --- UI STATE ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'totalTokens', direction: 'desc' });
  
  // Selection State
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Agent>>({
      name: '',
      description: '',
      model: 'gpt-4o',
      status: AgentStatus.OFFLINE,
      avgLatency: 0,
      successRate: 100,
  });

  // KPI Calculations
  const totalTokensConsumed = agents.reduce((acc, a) => acc + a.totalTokens, 0);
  const totalCost = agents.reduce((acc, a) => acc + a.cost, 0);
  const activeAgents = agents.filter(a => a.status === AgentStatus.ONLINE).length;
  const avgSuccessRate = agents.reduce((acc, a) => acc + a.successRate, 0) / (agents.length || 1);

  // Group models by provider for select
  const groupedModels = useMemo(() => {
    type ModelEntry = typeof MODEL_REGISTRY[string] & { id: string };
    const groups: Record<string, ModelEntry[]> = {};
    Object.entries(MODEL_REGISTRY).forEach(([key, value]) => {
        const entry = { ...value, id: key };
        if (!groups[value.provider]) groups[value.provider] = [];
        groups[value.provider].push(entry);
    });
    return groups;
  }, []);

  // Get current selected model pricing info
  const selectedModelInfo = MODEL_REGISTRY[formData.model || 'gpt-4o'];

  // --- LOGIC: Filtering & Sorting ---
  const filteredAgents = useMemo(() => {
    let result = [...agents];

    // 1. Filter
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(a => 
            a.name.toLowerCase().includes(lowerTerm) ||
            a.description.toLowerCase().includes(lowerTerm) ||
            a.model.toLowerCase().includes(lowerTerm)
        );
    }

    // 2. Sort
    result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();

        return sortConfig.direction === 'asc' 
            ? (aString < bString ? -1 : 1) 
            : (aString > bString ? -1 : 1);
    });

    return result;
  }, [agents, searchTerm, sortConfig]);

  // --- HANDLERS ---
  const handleSort = (key: SortKey) => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  const handleAddNew = () => {
      setSelectedAgent(null);
      setFormData({
        name: '',
        description: '',
        model: 'gpt-4o',
        status: AgentStatus.OFFLINE,
        avgLatency: 0,
        successRate: 100,
        // Tokens and Cost start at 0
      });
      setIsFormOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, agent: Agent) => {
      e.stopPropagation(); 
      setSelectedAgent(agent);
      setFormData({ ...agent });
      setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, agent: Agent) => {
      e.stopPropagation();
      setSelectedAgent(agent);
      setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
      if (selectedAgent) {
          deleteAgent(selectedAgent.id);
          addToast({
              type: 'success',
              title: 'Agente Removido',
              message: `${selectedAgent.name} foi removido com sucesso.`
          });
          setIsDeleteOpen(false);
          setSelectedAgent(null);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (selectedAgent) {
          updateAgent(selectedAgent.id, formData);
          addToast({ type: 'success', title: 'Agente Atualizado', message: 'Alterações salvas.' });
      } else {
          const newAgent: Agent = {
              id: Date.now().toString(),
              lastUsed: 'Agora',
              totalTokens: 0, // Init
              cost: 0,        // Init
              ...formData as Agent
          };
          addAgent(newAgent);
          addToast({ type: 'success', title: 'Novo Agente Criado', message: `${newAgent.name} adicionado.` });
      }
      setIsFormOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: ['avgLatency', 'successRate'].includes(name) ? Number(value) : value
      }));
  };

  // Helper for Status Badge
  const getStatusBadge = (status: AgentStatus) => {
      switch (status) {
          case AgentStatus.ONLINE:
              return <span className="px-2 py-0.5 rounded text-xs font-medium bg-neon-green/10 text-neon-green border border-neon-green/30">Online</span>;
          case AgentStatus.MAINTENANCE:
              return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">Manutenção</span>;
          case AgentStatus.TRAINING:
              return <span className="px-2 py-0.5 rounded text-xs font-medium bg-neon-blue/10 text-neon-blue border border-neon-blue/30 flex items-center gap-1"><Zap size={10}/> Treinando</span>;
          default:
              return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/30">Offline</span>;
      }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
      if (sortConfig.key !== column) return <ArrowUpDown size={12} className="opacity-30 ml-1" />;
      return sortConfig.direction === 'asc' 
        ? <ArrowUp size={12} className="text-neon-cyan ml-1" /> 
        : <ArrowDown size={12} className="text-neon-cyan ml-1" />;
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold font-display text-white">Agentes de IA</h1>
                <p className="text-sm text-gray-500 mt-1">Gerencie, treine e monitore o consumo dos seus agentes inteligentes.</p>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                 <div className="relative group grow md:grow-0">
                    <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar agentes..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all"
                    />
                </div>
                <button 
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-dark-bg font-bold rounded-lg text-sm hover:bg-neon-blue transition-all shadow-[0_0_15px_rgba(124,252,243,0.3)]"
                >
                    <Plus size={18} /> Novo Agente
                </button>
            </div>
        </div>

        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="flex items-center gap-4 border-neon-blue/20 bg-neon-blue/5">
                <div className="p-3 rounded-lg bg-neon-blue/10 text-neon-blue"><Bot size={24}/></div>
                <div>
                    <p className="text-xs text-gray-400 uppercase">Agentes Ativos</p>
                    <p className="text-2xl font-bold text-white">{activeAgents}/{agents.length}</p>
                </div>
            </Card>
            <Card className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-white/5 text-neon-purple"><Cpu size={24}/></div>
                <div>
                    <p className="text-xs text-gray-400 uppercase">Tokens Totais</p>
                    <p className="text-2xl font-bold text-white">{(totalTokensConsumed/1000000).toFixed(1)}M</p>
                </div>
            </Card>
            <Card className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-white/5 text-neon-green"><Activity size={24}/></div>
                <div>
                    <p className="text-xs text-gray-400 uppercase">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-white">{avgSuccessRate.toFixed(1)}%</p>
                </div>
            </Card>
             <Card className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-white/5 text-neon-pink"><Coins size={24}/></div>
                <div>
                    <p className="text-xs text-gray-400 uppercase">Custo Estimado</p>
                    <p className="text-2xl font-bold text-white">R$ {totalCost.toFixed(2)}</p>
                </div>
            </Card>
        </div>

        {/* Agents Table */}
        <Card className="overflow-hidden p-0 min-h-[500px]">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th onClick={() => handleSort('name')} className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors">
                            <div className="flex items-center">Nome / Descrição <SortIcon column="name" /></div>
                        </th>
                         <th onClick={() => handleSort('status')} className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors">
                            <div className="flex items-center">Status <SortIcon column="status" /></div>
                        </th>
                        <th onClick={() => handleSort('model')} className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors">
                            <div className="flex items-center">Modelo <SortIcon column="model" /></div>
                        </th>
                        <th onClick={() => handleSort('totalTokens')} className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors text-right">
                            <div className="flex items-center justify-end">Tokens <SortIcon column="totalTokens" /></div>
                        </th>
                         <th onClick={() => handleSort('avgLatency')} className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors text-right">
                            <div className="flex items-center justify-end">Latência (ms) <SortIcon column="avgLatency" /></div>
                        </th>
                         <th onClick={() => handleSort('successRate')} className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors">
                            <div className="flex items-center">Usabilidade <SortIcon column="successRate" /></div>
                        </th>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredAgents.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum agente encontrado.</td></tr>
                    ) : (
                        filteredAgents.map((agent) => (
                            <tr 
                                key={agent.id} 
                                onClick={() => navigate(`/agents/${agent.id}`)}
                                className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded bg-white/5 text-gray-400 group-hover:text-neon-cyan group-hover:bg-neon-cyan/10 transition-colors`}>
                                            <Bot size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white group-hover:text-neon-cyan transition-colors">{agent.name}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{agent.description}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">{getStatusBadge(agent.status)}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-mono text-gray-300 bg-white/5 px-2 py-1 rounded border border-white/5">{MODEL_REGISTRY[agent.model]?.label || agent.model}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right"><span className="text-sm font-mono text-white">{agent.totalTokens.toLocaleString()}</span></td>
                                <td className="p-4 text-right"><span className={`text-sm font-mono ${agent.avgLatency > 2000 ? 'text-yellow-500' : 'text-gray-300'}`}>{agent.avgLatency}ms</span></td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${agent.successRate > 98 ? 'bg-neon-green' : agent.successRate > 90 ? 'bg-neon-blue' : 'bg-red-500'}`} style={{ width: `${agent.successRate}%` }}></div>
                                        </div>
                                        <span className="text-xs font-mono text-gray-400">{agent.successRate}%</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => handleEdit(e, agent)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded"><Edit2 size={16} /></button>
                                        <button onClick={(e) => handleDeleteClick(e, agent)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </Card>

        {/* --- FORM MODAL --- */}
        {isFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-md bg-[#111625] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <h3 className="text-lg font-bold text-white font-display">
                            {selectedAgent ? 'Configurar Agente' : 'Novo Agente'}
                        </h3>
                        <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Nome</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Descrição</label>
                            <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none" />
                        </div>
                        
                        <div className="space-y-2">
                             <label className="text-xs font-semibold text-gray-400 uppercase">Modelo LLM</label>
                             <div className="relative">
                                <select 
                                    name="model" 
                                    value={formData.model} 
                                    onChange={handleChange} 
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 pr-8 text-white focus:border-neon-cyan focus:outline-none [&>option]:bg-dark-bg appearance-none"
                                >
                                    {Object.entries(groupedModels).map(([provider, models]) => (
                                        <optgroup key={provider} label={provider} className="text-gray-500 font-bold bg-dark-bg">
                                            {models.map(m => (
                                                <option key={m.id} value={m.id} className="text-white bg-dark-bg">
                                                    {m.label}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-2.5 pointer-events-none text-gray-500"><ArrowDown size={14} /></div>
                             </div>
                             
                             {/* Dynamic Pricing Info */}
                             {selectedModelInfo && (
                                <div className="mt-2 p-2 bg-white/[0.03] rounded border border-white/5 flex items-center justify-between text-xs">
                                    <span className="text-gray-400 flex items-center gap-1"><Tag size={12}/> {selectedModelInfo.provider}</span>
                                    <div className="flex gap-3">
                                        <span className="text-gray-300">In: <span className="text-neon-cyan">${selectedModelInfo.inputPrice.toFixed(2)}</span>/1M</span>
                                        <span className="text-gray-300">Out: <span className="text-neon-purple">${selectedModelInfo.outputPrice.toFixed(2)}</span>/1M</span>
                                    </div>
                                </div>
                             )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none [&>option]:bg-dark-bg">
                                    <option value={AgentStatus.ONLINE}>Online</option>
                                    <option value={AgentStatus.TRAINING}>Treinando</option>
                                    <option value={AgentStatus.MAINTENANCE}>Manutenção</option>
                                    <option value={AgentStatus.OFFLINE}>Offline</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Latência Meta (ms)</label>
                                <input type="number" name="avgLatency" value={formData.avgLatency} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none" />
                            </div>
                        </div>

                        {/* Note about auto-calculated fields */}
                        <div className="text-[10px] text-gray-500 italic mt-2 border-t border-white/5 pt-2">
                            * Tokens Totais e Custos são calculados automaticamente com base no uso real e na tabela de preços atualizada.
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded">Cancelar</button>
                            <button type="submit" className="px-6 py-2 bg-neon-cyan text-dark-bg font-bold rounded text-sm hover:bg-neon-blue flex items-center gap-2"><Check size={16} /> Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- DELETE MODAL --- */}
        {isDeleteOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-sm bg-[#111625] border border-red-500/30 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.15)] overflow-hidden">
                    <div className="p-6 text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><AlertTriangle size={24} /></div>
                        <h3 className="text-xl font-bold text-white mb-2">Excluir Agente?</h3>
                        <p className="text-sm text-gray-400 mb-6">Você está prestes a remover <strong>{selectedAgent?.name}</strong>. Todos os dados de histórico serão perdidos.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 bg-white/5 border border-white/10 rounded text-sm text-white hover:bg-white/10">Cancelar</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 shadow-lg shadow-red-500/20">Confirmar</button>
                        </div>
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};

export default AgentsPage;