import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { User, UserStatus, SuccessJourney } from '../types';
import { useUserStore } from '../store/useUserStore';
import { useUsersViewStore, SortKey, SortConfig } from '../store/useUsersViewStore';
import { Download, Plus, Edit2, Trash2, X, Check, AlertTriangle, Search, ArrowUpDown, ArrowUp, ArrowDown, Users, Zap, CreditCard, ChevronLeft, ChevronRight, FlaskConical, Calendar, Loader2, Clock, Database, Flag, Target, Layout, CheckSquare, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/useToastStore';

const ITEMS_PER_PAGE = 15;

// Helper para obter data local YYYY-MM-DD (consistente com input date)
const getLocalDateString = (date?: string | Date) => {
    const d = date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) return '';
    
    // Pega componentes locais
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

// Helper para datetime-local input (YYYY-MM-DDTHH:MM)
const getLocalDateTimeString = (date?: string | Date) => {
    const d = date && date !== 'Nunca' && date !== 'Agora' ? new Date(date) : new Date();
    // Se a data for inválida ou string amigável, usa agora
    if (isNaN(d.getTime())) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    }
    
    // Ajuste de timezone para o input
    const dLocal = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return dLocal.toISOString().slice(0, 16);
};

// Opções de Churn
const CHURN_REASONS = [
    "Carrinho Abandonado",
    "Cancelou",
    "Não Renovou",
    "Lead Frio",
    "Churn Manual"
];

// Helper Component para Badge de Jornada Dinâmica
const JourneyBadge = ({ journey }: { journey?: SuccessJourney }) => {
    if (!journey || journey.status === 'not_started') {
        return (
            <span className="hidden xl:inline-flex items-center gap-1 text-[9px] font-bold bg-white/5 text-gray-500 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-wide" title="Jornada: Não Iniciada">
                <Layout size={8} /> Setup
            </span>
        );
    }
    
    if (journey.status === 'achieved') {
        return (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-neon-green/20 text-neon-green px-1.5 py-0.5 rounded border border-neon-green/30 uppercase tracking-wide shadow-[0_0_8px_rgba(52,255,176,0.2)]" title="Jornada: Resultado Atingido">
                <Flag size={8} fill="currentColor" /> Success
            </span>
        );
    }

    // Lógica para mostrar o último passo completado ou "Onboarding" se estiver no começo
    const completedSteps = journey.steps.filter(s => s.isCompleted);
    const lastStep = completedSteps.length > 0 ? completedSteps[completedSteps.length - 1] : null;

    if (lastStep) {
        return (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-neon-blue/20 text-neon-blue px-1.5 py-0.5 rounded border border-neon-blue/30 uppercase tracking-wide" title={`Jornada Atual: ${lastStep.label}`}>
                <CheckSquare size={8} /> {lastStep.label.split(' ')[0]} {/* Mostra apenas a primeira palavra para economizar espaço */}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded border border-gray-600 uppercase tracking-wide" title="Jornada: Iniciando">
            <Target size={8} /> Onboarding
        </span>
    );
};

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  
  // Connect to Global Stores
  const { users, addUser, updateUser, deleteUser, fetchUsers } = useUserStore();
  const { 
      searchTerm, 
      sortConfig, 
      currentPage, 
      setSearchTerm, 
      setSortConfig, 
      setCurrentPage 
  } = useUsersViewStore();

  // --- UI STATE (Modals/Forms Local) ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false); 
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Selection State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form State (Main Edit)
  const [formData, setFormData] = useState<Partial<User>>({
      name: '',
      company: '',
      phone: '',
      email: '',
      plan: 'Starter',
      status: UserStatus.NEW,
      mrr: 0,
      isTest: false,
      joinedAt: '',
      churnReason: ''
  });

  // Access Date State (Separate Flow)
  const [accessDate, setAccessDate] = useState('');

  // --- KPI CALCULATIONS ---
  // Total Users: Exclude only Churned (Include Active, Risk, New, Ghost)
  const totalUsers = users.filter(u => u.status !== UserStatus.CHURNED).length;
  const activeUsers = users.filter(u => u.status === UserStatus.ACTIVE).length;
  const riskUsers = users.filter(u => u.status === UserStatus.RISK).length;
  
  // Calculate Average Engagement
  // Filtrar apenas usuários REAIS e NÃO CANCELADOS para a média de engajamento
  const validEngagementUsers = users.filter(u => !u.isTest && u.status !== UserStatus.CHURNED);
  const avgEngagement = Math.round(
    validEngagementUsers.reduce((acc, u) => acc + (u.metrics?.engagement || 0), 0) / (validEngagementUsers.length || 1)
  );

  // Calculate ARPU (Average Revenue Per User) - "Média Planos"
  // Regra: Apenas usuários reais (não teste) e que NÃO estão cancelados (Ativo, Risco, Fantasma, Novo)
  const validRevenueUsers = users.filter(u => !u.isTest && u.status !== UserStatus.CHURNED);
  const totalMRR = validRevenueUsers.reduce((acc, u) => acc + u.mrr, 0);
  const arpu = validRevenueUsers.length > 0 ? totalMRR / validRevenueUsers.length : 0;

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

  // --- LOGIC: Pagination ---
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  
  // Ensure we don't show an empty page if filtering reduced results
  useEffect(() => {
      if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(1);
      }
  }, [totalPages, currentPage, setCurrentPage]);

  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // --- HANDLERS ---

  const handleSort = (key: SortKey) => {
      setSortConfig({
          key,
          direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
  };

  const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
          setCurrentPage(newPage);
      }
  };

  const handlePrint = () => {
      window.print();
  };

  const handleExportCSV = () => {
      // Create CSV content
      const headers = ['ID', 'Nome', 'Empresa', 'Telefone', 'Email', 'Status', 'Plano', 'Health Score', 'MRR', 'Entrada', 'Teste'];
      const rows = filteredUsers.map(u => [
          u.id,
          `"${u.name}"`,
          `"${u.company}"`,
          `"${u.phone || ''}"`,
          u.email,
          u.status,
          u.plan,
          u.healthScore,
          u.mrr,
          u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : '',
          u.isTest ? 'SIM' : 'NAO'
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
        phone: '',
        email: '',
        plan: 'Starter',
        status: UserStatus.NEW,
        mrr: 0,
        isTest: false,
        // Usa data local para "Hoje"
        joinedAt: getLocalDateString(),
        churnReason: ''
      });
      setIsFormOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, user: User) => {
      e.stopPropagation(); 
      setSelectedUser(user);
      
      // Usa helper para converter a data do banco para YYYY-MM-DD (Input Date)
      // respeitando o fuso local do navegador
      const safeDate = user.joinedAt ? getLocalDateString(user.joinedAt) : '';

      setFormData({ 
          ...user, 
          isTest: !!user.isTest, 
          joinedAt: safeDate,
          churnReason: user.churnReason || '',
          phone: user.phone || ''
      });
      setIsFormOpen(true);
  };

  // --- LAST ACCESS HANDLERS ---
  const handleOpenAccessModal = (e: React.MouseEvent, user: User) => {
      e.stopPropagation();
      setSelectedUser(user);
      // Prepara a data atual ou a data salva para o input
      // Se lastActive for 'Agora' ou 'Nunca', usa o momento atual
      setAccessDate(getLocalDateTimeString(user.lastActive === 'Agora' || user.lastActive === 'Nunca' ? new Date() : new Date(user.lastActive)));
      setIsAccessModalOpen(true);
  };

  const handleSaveAccess = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUser || !accessDate) return;

      setIsSaving(true);
      try {
          // Converte o valor do input datetime-local para string legível na UI
          // e formato que o backend entenda (no caso, o backend espera algo que caiba em last_active)
          const dateObj = new Date(accessDate);
          const isoString = dateObj.toISOString();
          
          // Enviamos para o store (que manda pro DB). 
          await updateUser(selectedUser.id, { 
              lastActive: isoString 
          });

          // Forçar um refresh do Supabase para garantir que a persistência ocorreu
          // Isso ajuda a confirmar para o usuário que não é apenas uma mudança local
          await fetchUsers();
          
          addToast({ type: 'success', title: 'Acesso Registrado', message: `Último acesso de ${selectedUser.name} sincronizado com o banco.` });
          setIsAccessModalOpen(false);
      } catch (error) {
          addToast({ type: 'error', title: 'Erro', message: 'Falha ao atualizar data de acesso.' });
      } finally {
          setIsSaving(false);
      }
  };

  const handleDeleteClick = (e: React.MouseEvent, user: User) => {
      e.stopPropagation();
      setSelectedUser(user);
      setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
      if (selectedUser) {
          setIsSaving(true);
          try {
            await deleteUser(selectedUser.id);
            addToast({
                type: 'success',
                title: 'Usuário Removido',
                message: `${selectedUser.name} foi removido com sucesso.`
            });
            setIsDeleteOpen(false);
            setSelectedUser(null);
          } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Falha ao excluir usuário.' });
          } finally {
            setIsSaving(false);
          }
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      
      try {
        if (selectedUser) {
            await updateUser(selectedUser.id, formData);
            addToast({ type: 'success', title: 'Perfil Atualizado', message: 'Alterações salvas com sucesso.' });
        } else {
            await addUser(formData);
            addToast({ type: 'success', title: 'Novo Usuário Criado', message: `${formData.name} adicionado.` });
        }
        setIsFormOpen(false);
      } catch (error: any) {
        console.error("Save error:", error);
        addToast({ 
            type: 'error', 
            title: 'Erro ao Salvar', 
            message: error.message || 'Erro desconhecido ao comunicar com o banco de dados.' 
        });
      } finally {
        setIsSaving(false);
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
      } else {
        setFormData(prev => ({
            ...prev,
            [name]: name === 'mrr' ? Number(value) : value
        }));
      }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
      if (sortConfig.key !== column) return <ArrowUpDown size={12} className="opacity-30 ml-1" />;
      return sortConfig.direction === 'asc' 
        ? <ArrowUp size={12} className="text-neon-cyan ml-1" /> 
        : <ArrowDown size={12} className="text-neon-cyan ml-1" />;
  };

  // Helper para mostrar data amigável na tabela
  const formatLastActive = (dateStr: string) => {
      if (!dateStr || dateStr === 'Nunca') return 'Nunca';
      if (dateStr === 'Agora') return 'Agora';
      // Tenta fazer parse se for ISO
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
          return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return dateStr;
  }

  return (
    <>
    {/* Style Block to Force Print Layout */}
    <style>{`
        @media print {
            @page { size: auto; margin: 10mm; }
            
            /* RESETAR BLOQUEIOS DE SCROLL DO LAYOUT PRINCIPAL */
            html, body, #root, main {
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
                display: block !important;
            }

            /* ESCONDER TUDO DA TELA */
            body * {
                visibility: hidden;
            }

            /* MOSTRAR APENAS ÁREA DE IMPRESSÃO */
            #print-area, #print-area * {
                visibility: visible;
            }

            /* POSICIONAR NO TOPO ABSOLUTO DO DOC */
            #print-area {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                margin: 0;
                background: white;
                color: black;
            }
        }
    `}</style>

    <div className="p-8 max-w-[1600px] mx-auto relative print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold font-display text-white">Usuários</h1>
                <p className="text-sm text-gray-500 mt-1">Gerencie o acesso, planos e saúde da base de clientes.</p>
            </div>
            
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
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <Printer size={16} /> PDF
                </button>
                <button 
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-dark-bg font-bold rounded-lg text-sm hover:bg-neon-blue transition-all shadow-[0_0_15px_rgba(124,252,243,0.3)]"
                >
                    <Plus size={18} /> Novo Usuário
                </button>
            </div>
        </div>

        {/* ... KPIs ... */}
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
                    <p className="text-xs text-gray-400 uppercase">Ticket Médio (Real)</p>
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

        <Card className="overflow-hidden p-0 min-h-[600px] flex flex-col justify-between">
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
                            onClick={() => handleSort('joinedAt')}
                            className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 hover:text-gray-300 transition-colors select-none"
                        >
                            <div className="flex items-center">Data Entrada <SortIcon column="joinedAt" /></div>
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
                        <th 
                            onClick={() => handleSort('lastActive')}
                            className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-white/5 hover:text-gray-300 transition-colors select-none"
                        >
                             <div className="flex items-center">Último Acesso <SortIcon column="lastActive" /></div>
                        </th>
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
                            <td colSpan={8} className="p-8 text-center text-gray-500">
                                Nenhum usuário encontrado para "{searchTerm}".
                            </td>
                        </tr>
                    ) : (
                        paginatedUsers.map((user) => (
                            <tr 
                                key={user.id} 
                                onClick={() => navigate(`/users/${user.id}`)}
                                className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        
                                        {/* INDICADOR PISCANTE SOMENTE SE STATUS === RISCO */}
                                        {user.status === UserStatus.RISK && (
                                            <div className="relative flex h-3 w-3 shrink-0 ml-1" title="Atenção Necessária">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                                            </div>
                                        )}
                                        
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-medium text-white group-hover:text-neon-cyan transition-colors">{user.name}</p>
                                                
                                                {/* BADGES ROW */}
                                                {user.isTest && (
                                                    <span className="text-[9px] font-bold bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded border border-gray-600 uppercase tracking-wide" title="Usuário de Teste (Não conta para métricas)">
                                                        TESTE
                                                    </span>
                                                )}
                                                
                                                <JourneyBadge journey={user.journey} />
                                            </div>
                                            <p className="text-xs text-gray-500">{user.company}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-gray-400 font-mono">
                                        {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : '-'}
                                    </span>
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
                                    <span className="text-sm text-gray-400 font-mono">{formatLastActive(user.lastActive)}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <span className={`text-sm font-medium font-mono ${user.isTest ? 'text-gray-500 line-through decoration-gray-600' : 'text-white'}`}>
                                        R$ {user.mrr.toLocaleString()}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleOpenAccessModal(e, user)}
                                            className="p-1.5 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded transition-colors"
                                            title="Registrar Acesso Manual"
                                        >
                                            <Clock size={16} />
                                        </button>
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

            {/* Pagination ... */}
            {filteredUsers.length > 0 && (
                <div className="p-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.01]">
                    <span className="text-xs text-gray-500">
                        Mostrando <span className="font-medium text-white">{startIndex + 1}</span> - <span className="font-medium text-white">{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)}</span> de <span className="font-medium text-white">{filteredUsers.length}</span> usuários
                    </span>

                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`
                                p-2 rounded-lg border border-transparent transition-colors
                                ${currentPage === 1 
                                    ? 'text-gray-600 cursor-not-allowed' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10'}
                            `}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: totalPages }).map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`
                                            w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all
                                            ${currentPage === pageNum 
                                                ? 'bg-neon-cyan text-dark-bg font-bold shadow-[0_0_10px_rgba(124,252,243,0.3)]' 
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                        `}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`
                                p-2 rounded-lg border border-transparent transition-colors
                                ${currentPage === totalPages
                                    ? 'text-gray-600 cursor-not-allowed' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10'}
                            `}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </Card>

        {/* ... MODALS ... */}
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
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Empresa</label>
                                <input 
                                    type="text" name="company" required value={formData.company} onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none transition-colors"
                                    placeholder="Ex: Acme Corp"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">WhatsApp / Telefone</label>
                                <input 
                                    type="text" name="phone" value={formData.phone} onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none transition-colors"
                                    placeholder="(99) 99999-9999"
                                />
                            </div>
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
                                    <option value="Pro Creator">Pro Creator</option>
                                    <option value="Mentor Max">Mentor Max</option>
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

                        {/* --- Motivo do Churn (Condicional) --- */}
                        {formData.status === UserStatus.CHURNED && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-xs font-semibold text-red-400 uppercase">Motivo do Churn</label>
                                <select 
                                    name="churnReason" 
                                    value={formData.churnReason} 
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-red-500/30 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none transition-colors [&>option]:bg-dark-bg"
                                >
                                    <option value="" disabled>Selecione o motivo...</option>
                                    {CHURN_REASONS.map(reason => (
                                        <option key={reason} value={reason}>{reason}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
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
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Data de Entrada</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-gray-500 pointer-events-none" size={14} />
                                    <input 
                                        type="date" 
                                        name="joinedAt" 
                                        value={formData.joinedAt} 
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded pl-9 pr-3 py-2 text-white focus:border-neon-cyan focus:outline-none transition-colors [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${formData.isTest ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-gray-700/50 text-gray-400'}`}>
                                    <FlaskConical size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Usuário de Teste</p>
                                    <p className="text-[10px] text-gray-500">Não contabilizar no Ticket Médio (ARPU)</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="isTest"
                                    checked={formData.isTest || false} 
                                    onChange={handleChange} 
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
                            </label>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button 
                                type="button" onClick={() => setIsFormOpen(false)}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className={`
                                    px-6 py-2 bg-neon-cyan text-dark-bg font-bold rounded text-sm hover:bg-neon-blue transition-colors flex items-center gap-2
                                    ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}
                                `}
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* ... ACCESS MODAL ... */}
        {isAccessModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-sm bg-[#111625] border border-white/10 rounded-xl shadow-[0_0_30px_rgba(124,252,243,0.1)] overflow-hidden">
                    <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                        <div className="flex items-center gap-2 text-white font-display font-bold">
                            <Clock size={18} className="text-neon-cyan" />
                            Registrar Acesso
                        </div>
                        <button onClick={() => setIsAccessModalOpen(false)} className="text-gray-400 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSaveAccess} className="p-6">
                        <p className="text-sm text-gray-400 mb-4">
                            Atualizando status para: <br/> <strong className="text-white">{selectedUser?.name}</strong>
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data e Hora</label>
                                <input 
                                    type="datetime-local" 
                                    value={accessDate}
                                    onChange={(e) => setAccessDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan focus:outline-none [color-scheme:dark]"
                                    required
                                />
                            </div>
                            
                            <button 
                                type="button"
                                onClick={() => {
                                    const now = new Date();
                                    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                                    setAccessDate(now.toISOString().slice(0, 16));
                                }}
                                className="text-xs text-neon-cyan hover:underline flex items-center gap-1"
                            >
                                <Clock size={12} /> Definir como Agora
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                type="button" 
                                onClick={() => setIsAccessModalOpen(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 bg-neon-cyan text-dark-bg font-bold rounded text-sm hover:bg-neon-blue transition-colors flex items-center gap-2"
                            >
                                {isSaving ? 'Salvando...' : 'Confirmar'}
                            </button>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-gray-500 flex items-center gap-1">
                            <Database size={10} />
                            Os dados são salvos diretamente no banco de dados.
                        </div>
                    </form>
                </div>
            </div>
        )}

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
                                disabled={isSaving}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded text-sm text-white hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                disabled={isSaving}
                                className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors font-medium shadow-lg shadow-red-500/20 flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                                Confirmar Exclusão
                            </button>
                        </div>
                    </div>
                </div>
             </div>
        )}
    </div>

    {/* --- PRINT ONLY LAYOUT (Relatório Geral) --- */}
    <div id="print-area" className="hidden print:block w-full h-auto bg-white z-[9999] p-8 text-black">
        <div className="text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-3xl font-bold uppercase tracking-wider">Relatório de Base de Clientes</h1>
            <p className="text-gray-600 mt-2">
                Gerado em {new Date().toLocaleDateString()} • {filteredUsers.length} registros
            </p>
        </div>

        <div className="space-y-6">
            {filteredUsers.map((u, index) => (
                <div key={u.id} className="break-inside-avoid page-break-inside-avoid border border-gray-300 rounded-lg p-5 bg-gray-50 mb-4 shadow-none">
                    {/* Header info */}
                    <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-3">
                        <div>
                            <h2 className="text-xl font-bold">{u.name}</h2>
                            <p className="text-sm text-gray-600">{u.company} • {u.email}</p>
                        </div>
                        <div className="text-right">
                            <span className="inline-block px-2 py-1 border border-black rounded text-xs font-bold uppercase mb-1">
                                {u.status}
                            </span>
                            <p className="text-xs text-gray-500">ID: {u.id.slice(0,8)}</p>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Plano</p>
                            <p className="font-semibold">{u.plan}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Valor Mensal</p>
                            <p className="font-bold text-lg text-black">R$ {u.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Health Score</p>
                            <p className="font-semibold">{u.healthScore}/100</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Entrada</p>
                            <p className="font-semibold">{new Date(u.joinedAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Journey Steps Compact */}
                    <div className="bg-white border border-gray-200 rounded p-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <Flag size={12}/> Detalhes da Jornada
                        </p>
                        {u.journey ? (
                            <div className="space-y-2">
                                <p className="text-sm font-bold mb-2">Objetivo: {u.journey.coreGoal}</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {u.journey.steps.map((step, sIdx) => (
                                        <div key={sIdx} className={`text-center p-2 rounded border ${step.isCompleted ? 'bg-gray-100 border-gray-400' : 'border-gray-100'}`}>
                                            <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${step.isCompleted ? 'bg-black' : 'bg-gray-200'}`}></div>
                                            <p className={`text-[9px] uppercase leading-tight ${step.isCompleted ? 'font-bold text-black' : 'text-gray-400'}`}>
                                                {step.label} 
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Jornada não iniciada.</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400 border-t pt-4">
            Fim do Relatório • NEONDASH
        </div>
    </div>
    </>
  );
};

export default UsersPage;