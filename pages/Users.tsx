import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { User, UserStatus } from '../types';
import { useUserStore } from '../store/useUserStore';
import { Download, Plus, Edit2, Trash2, X, Check, AlertTriangle, Search, ArrowUpDown, ArrowUp, ArrowDown, Users, Zap, CreditCard, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/useToastStore';

type SortKey = keyof User | 'mrr' | 'healthScore';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  
  // Connect to Global Store
  const { users, addUser, updateUser, deleteUser } = useUserStore();

  // --- UI STATE ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'healthScore', direction: 'desc' });
  
  // Selection State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<User>>({
      name: '',
      company: '',
      email: '',
      plan: 'Starter',
      status: UserStatus.NEW,
      mrr: 0
  });

  // --- KPI CALCULATIONS ---
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === UserStatus.ACTIVE).length;
  const riskUsers = users.filter(u => u.status === UserStatus.RISK).length;
  
  // Calculate Average Engagement
  const avgEngagement = Math.round(
    users.reduce((acc, u) => acc + (u.metrics?.engagement || 0), 0) / (totalUsers || 1)
  );

  // Calculate ARPU (Average Revenue Per User) - "Média Planos"
  const totalMRR = users.reduce((acc, u) => acc + u.mrr, 0);
  const arpu = totalUsers > 0 ? totalMRR / totalUsers : 0;

  // --- LOGIC: Filtering & Sorting ---

  const filteredUsers = useMemo(() => {
    let result = [...users];

    // 1. Filter
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(u => 
            u.name.toLowerCase().includes(lowerTerm) ||
            u.email.toLowerCase().includes(lowerTerm) ||
            u.company.toLowerCase().includes(lowerTerm)
        );
    }

    // 2. Sort
    result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;
        
        // Handle numeric sorting vs string sorting
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();

        if (sortConfig.direction === 'asc') {
            return aString < bString ? -1 : 1;
        } else {
            return aString > bString ? -1 : 1;
        }
    });

    return result;
  }, [users, searchTerm, sortConfig]);

  // --- HANDLERS ---

  const handleSort = (key: SortKey) => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  const handleExportCSV = () => {
      // Create CSV content
      const headers = ['ID', 'Nome', 'Empresa', 'Email', 'Status', 'Plano', 'Health Score', 'MRR'];
      const rows = filteredUsers.map(u => [
          u.id,
          `"${u.name}"`,
          `"${u.company}"`,
          u.email,
          u.status,
          u.plan,
          u.healthScore,
          u.mrr
      ]);

      const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `neondash_users_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
          type: 'success',
          title: 'Exportação Concluída',
          message: `${filteredUsers.length} registros exportados para CSV.`
      });
  };

  const handleAddNew = () => {
      setSelectedUser(null);
      setFormData({
        name: '',
        company: '',
        email: '',
        plan: 'Starter',
        status: UserStatus.NEW,
        mrr: 0
      });
      setIsFormOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, user: User) => {
      e.stopPropagation(); 
      setSelectedUser(user);
      setFormData({ ...user });
      setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, user: User) => {
      e.stopPropagation();
      setSelectedUser(user);
      setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
      if (selectedUser) {
          deleteUser(selectedUser.id);
          addToast({
              type: 'success',
              title: 'Usuário Removido',
              message: `${selectedUser.name} foi removido com sucesso.`
          });
          setIsDeleteOpen(false);
          setSelectedUser(null);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (selectedUser) {
          updateUser(selectedUser.id, formData);
          addToast({ type: 'success', title: 'Perfil Atualizado', message: 'Alterações salvas.' });
      } else {
          const newUser: User = {
              id: Date.now().toString(),
              avatar: `https://picsum.photos/40/40?random=${Date.now()}`,
              healthScore: 100,
              lastActive: 'Agora',
              tokensUsed: 0,
              ...formData as User
          };
          addUser(newUser);
          addToast({ type: 'success', title: 'Novo Usuário Criado', message: `${newUser.name} adicionado.` });
      }
      setIsFormOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: name === 'mrr' ? Number(value) : value
      }));
  };

  // Helper for Sort Icon
  const SortIcon = ({ column }: { column: SortKey }) => {
      if (sortConfig.key !== column) return <ArrowUpDown size={12} className="opacity-30 ml-1" />;
      return sortConfig.direction === 'asc' 
        ? <ArrowUp size={12} className="text-neon-cyan ml-1" /> 
        : <ArrowDown size={12} className="text-neon-cyan ml-1" />;
  };

  // Helper for Status Signal Color
  const getStatusDotColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE: return 'bg-neon-green shadow-[0_0_8px_#34FFB0]';
      case UserStatus.RISK: return 'bg-red-500 shadow-[0_0_8px_#ef4444]';
      case UserStatus.CHURNED: return 'bg-gray-500';
      case UserStatus.GHOST: return 'bg-neon-purple shadow-[0_0_8px_#9B5CFF]';
      case UserStatus.NEW: return 'bg-neon-blue shadow-[0_0_8px_#4EE1FF]';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold font-display text-white">Usuários</h1>
                <p className="text-sm text-gray-500 mt-1">Gerencie o acesso, planos e saúde da base de clientes.</p>
            </div>
            
            {/* ACTIONS & SEARCH - MOVED TO HEADER */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="relative group grow md:grow-0">
                    <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome, email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all"
                    />
                </div>
                
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <Download size={16} /> CSV
                </button>
                <button 
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-dark-bg font-bold rounded-lg text-sm hover:bg-neon-blue transition-all shadow-[0_0_15px_rgba(124,252,243,0.3)]"
                >
                    <Plus size={18} /> Novo Usuário
                </button>
            </div>
        </div>

        {/* --- KPI CARDS SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="flex items-center gap-4 border-neon-blue/20 bg-neon-blue/5">
                <div className="p-3 rounded-lg bg-neon-blue/10 text-neon-blue"><Users size={24}/></div>
                <div>
                    <p className="text-xs text-gray-400 uppercase">Total Usuários</p>
                    <p className="text-2xl font-bold text-white">
                        {totalUsers} <span className="text-sm font-normal text-gray-500">({activeUsers} ativos)</span>
                    </p>
                </div>
            </Card>
            
            <Card className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-white/5 text-neon-purple"><CreditCard size={24}/></div>
                <div>
                    <p className="text-xs text-gray-400 uppercase">Ticket Médio</p>
                    <p className="text-2xl font-bold text-white">R$ {arpu.toFixed(0)}</p>
                </div>
            </Card>

            <Card className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-white/5 text-neon-green"><Zap size={24}/></div>
                <div>
                    <p className="text-xs text-gray-400 uppercase">Engajamento Médio</p>
                    <p className="text-2xl font-bold text-white">{avgEngagement}%</p>
                </div>
            </Card>

            <Card className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-white/5 text-neon-pink"><AlertTriangle size={24}/></div>
                <div>
                    <p className="text-xs text-gray-400 uppercase">Em Risco</p>
                    <p className="text-2xl font-bold text-white">{riskUsers}</p>
                </div>
            </Card>
        </div>

        <Card className="overflow-hidden p-0 min-h-[500px]">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th 
                            onClick={() => handleSort('name')}
                            className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 hover:text-gray-300 transition-colors select-none group"
                        >
                            <div className="flex items-center">Usuário / Empresa <SortIcon column="name" /></div>
                        </th>
                        <th 
                            onClick={() => handleSort('status')}
                            className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 hover:text-gray-300 transition-colors select-none"
                        >
                            <div className="flex items-center">Status <SortIcon column="status" /></div>
                        </th>
                        <th 
                            onClick={() => handleSort('plan')}
                            className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 hover:text-gray-300 transition-colors select-none"
                        >
                             <div className="flex items-center">Plano <SortIcon column="plan" /></div>
                        </th>
                        <th 
                            onClick={() => handleSort('healthScore')}
                            className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 hover:text-gray-300 transition-colors select-none"
                        >
                             <div className="flex items-center">Health Score <SortIcon column="healthScore" /></div>
                        </th>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Último Acesso</th>
                        <th 
                            onClick={() => handleSort('mrr')}
                            className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right cursor-pointer hover:bg-white/5 hover:text-gray-300 transition-colors select-none"
                        >
                             <div className="flex items-center justify-end">RRC <SortIcon column="mrr" /></div>
                        </th>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredUsers.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="p-8 text-center text-gray-500">
                                Nenhum usuário encontrado para "{searchTerm}".
                            </td>
                        </tr>
                    ) : (
                        filteredUsers.map((user) => (
                            <tr 
                                key={user.id} 
                                onClick={() => navigate(`/users/${user.id}`)}
                                className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {/* REPLACED AVATAR WITH PULSING SIGNAL */}
                                        <div className="relative flex h-3 w-3 shrink-0 ml-1">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusDotColor(user.status).split(' ')[0]}`}></span>
                                            <span className={`relative inline-flex rounded-full h-3 w-3 ${getStatusDotColor(user.status)}`}></span>
                                        </div>
                                        
                                        <div>
                                            <p className="text-sm font-medium text-white group-hover:text-neon-cyan transition-colors">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.company}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Badge status={user.status} />
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300 border border-white/10">{user.plan}</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${user.healthScore > 70 ? 'bg-neon-green' : user.healthScore > 40 ? 'bg-amber-400' : 'bg-red-500'}`} 
                                                style={{ width: `${user.healthScore}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-mono text-gray-400">{user.healthScore}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-gray-400">{user.lastActive}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <span className="text-sm font-medium text-white font-mono">R$ {user.mrr.toLocaleString()}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleEdit(e, user)}
                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteClick(e, user)}
                                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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
                            {selectedUser ? 'Editar Usuário' : 'Novo Cadastro'}
                        </h3>
                        <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Nome Completo</label>
                            <input 
                                type="text" name="name" required value={formData.name} onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none transition-colors"
                                placeholder="Ex: João Silva"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Empresa</label>
                            <input 
                                type="text" name="company" required value={formData.company} onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none transition-colors"
                                placeholder="Ex: Acme Corp"
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Email</label>
                            <input 
                                type="email" name="email" required value={formData.email} onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none transition-colors"
                                placeholder="Ex: joao@acme.com"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Plano</label>
                                <select 
                                    name="plan" value={formData.plan} onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none transition-colors [&>option]:bg-dark-bg"
                                >
                                    <option value="Starter">Starter</option>
                                    <option value="Pro">Pro</option>
                                    <option value="Enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Status</label>
                                <select 
                                    name="status" value={formData.status} onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none transition-colors [&>option]:bg-dark-bg"
                                >
                                    <option value={UserStatus.NEW}>Novo</option>
                                    <option value={UserStatus.ACTIVE}>Ativo</option>
                                    <option value={UserStatus.RISK}>Risco</option>
                                    <option value={UserStatus.GHOST}>Fantasma</option>
                                    <option value={UserStatus.CHURNED}>Cancelado</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Receita Mensal (RRC)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                                <input 
                                    type="number" name="mrr" required value={formData.mrr} onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded pl-10 pr-3 py-2 text-white focus:border-neon-cyan focus:outline-none transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button 
                                type="button" onClick={() => setIsFormOpen(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                className="px-6 py-2 bg-neon-cyan text-dark-bg font-bold rounded text-sm hover:bg-neon-blue transition-colors flex items-center gap-2"
                            >
                                <Check size={16} /> Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {isDeleteOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-sm bg-[#111625] border border-red-500/30 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.15)] overflow-hidden">
                    <div className="p-6 text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Excluir Usuário?</h3>
                        <p className="text-sm text-gray-400 mb-6">
                            Você está prestes a remover <strong>{selectedUser?.name}</strong>. 
                            <br/>Essa ação não pode ser desfeita e todos os dados de histórico serão perdidos.
                        </p>
                        
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => setIsDeleteOpen(false)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded text-sm text-white hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors font-medium shadow-lg shadow-red-500/20"
                            >
                                Confirmar Exclusão
                            </button>
                        </div>
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};

export default UsersPage;