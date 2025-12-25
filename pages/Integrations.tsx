import React, { useState } from 'react';
import { 
    Network, 
    Plug, 
    Webhook, 
    Key, 
    CheckCircle, 
    AlertCircle, 
    Plus, 
    Trash2, 
    Copy, 
    Eye, 
    EyeOff, 
    Github, 
    Database, 
    Brain, 
    Lock,
    RefreshCw,
    FileSpreadsheet
} from 'lucide-react';
import Card from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { useToastStore } from '../store/useToastStore';

// --- MOCK DATA TYPES ---
interface ConnectedApp {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    status: 'connected' | 'disconnected' | 'error';
    color: string;
}

interface Webhook {
    id: string;
    url: string;
    events: string[];
    status: 'active' | 'failed';
    lastTriggered: string;
}

interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    createdAt: string;
    lastUsed: string;
}

const Integrations: React.FC = () => {
    const { addToast } = useToastStore();
    const [webhookUrl, setWebhookUrl] = useState('');
    const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');

    // --- MOCK STATE ---
    const [apps, setApps] = useState<ConnectedApp[]>([
        {
            id: 'openai',
            name: 'OpenAI',
            description: 'Conecte seus modelos GPT para os agentes.',
            icon: <Brain size={32} />,
            status: 'connected',
            color: 'text-neon-green'
        },
        {
            id: 'github',
            name: 'GitHub',
            description: 'Sincronização de código e deploys automáticos.',
            icon: <Github size={32} />,
            status: 'disconnected',
            color: 'text-white'
        },
        {
            id: 'google-sheets',
            name: 'Google Sheets',
            description: 'Exportação automática de leads e relatórios de métricas.',
            icon: <FileSpreadsheet size={32} />,
            status: 'disconnected',
            color: 'text-neon-green'
        },
        {
            id: 'clerk',
            name: 'Clerk Auth',
            description: 'Gerenciamento de identidade e sessões de usuários.',
            icon: <Lock size={32} />,
            status: 'connected',
            color: 'text-neon-purple'
        },
        {
            id: 'langsmith',
            name: 'LangSmith',
            description: 'Observabilidade e tracing para LLMs em produção.',
            icon: <Database size={32} />,
            status: 'error',
            color: 'text-neon-blue'
        }
    ]);

    const [webhooks, setWebhooks] = useState<Webhook[]>([
        { id: 'wh_123', url: 'https://api.meusite.com/events', events: ['user.created', 'payment.success'], status: 'active', lastTriggered: 'há 2 min' },
        { id: 'wh_456', url: 'https://hooks.zapier.com/x/9921', events: ['agent.error'], status: 'failed', lastTriggered: 'há 4 horas' }
    ]);

    const [apiKeys, setApiKeys] = useState<ApiKey[]>([
        { id: 'k_1', name: 'Produção Server', prefix: 'sk-neon-prod...', createdAt: '12/10/2023', lastUsed: 'Agora' },
        { id: 'k_2', name: 'Ambiente Dev', prefix: 'sk-neon-dev...', createdAt: '05/01/2024', lastUsed: 'há 5 dias' }
    ]);

    // --- HANDLERS ---

    const toggleAppStatus = (id: string) => {
        setApps(prev => prev.map(app => {
            if (app.id === id) {
                const newStatus = app.status === 'connected' ? 'disconnected' : 'connected';
                addToast({
                    type: newStatus === 'connected' ? 'success' : 'info',
                    title: newStatus === 'connected' ? 'Integração Ativada' : 'Integração Pausada',
                    message: `A conexão com ${app.name} foi atualizada.`
                });
                return { ...app, status: newStatus };
            }
            return app;
        }));
    };

    const handleCreateWebhook = (e: React.FormEvent) => {
        e.preventDefault();
        if(!webhookUrl) return;
        
        const newHook: Webhook = {
            id: `wh_${Date.now()}`,
            url: webhookUrl,
            events: ['*'],
            status: 'active',
            lastTriggered: '-'
        };
        setWebhooks([...webhooks, newHook]);
        setWebhookUrl('');
        addToast({ type: 'success', title: 'Webhook Criado', message: 'Endpoint registrado com sucesso.' });
    };

    const handleDeleteWebhook = (id: string) => {
        setWebhooks(prev => prev.filter(w => w.id !== id));
        addToast({ type: 'info', title: 'Webhook Removido', message: 'O endpoint não receberá mais eventos.' });
    };

    const handleGenerateKey = () => {
        if(!newKeyName) return;
        const newKey: ApiKey = {
            id: `k_${Date.now()}`,
            name: newKeyName,
            prefix: `sk-neon-${Math.random().toString(36).substring(7)}...`,
            createdAt: 'Hoje',
            lastUsed: '-'
        };
        setApiKeys([...apiKeys, newKey]);
        setNewKeyName('');
        setIsCreateKeyOpen(false);
        addToast({ type: 'success', title: 'Chave API Gerada', message: 'Guarde sua chave em local seguro.' });
    };

    const handleDeleteKey = (id: string) => {
        setApiKeys(prev => prev.filter(k => k.id !== id));
        addToast({ type: 'warning', title: 'Chave Revogada', message: 'Acesso bloqueado imediatamente para esta credencial.' });
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto pb-20">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white">Integrações</h1>
                    <p className="text-gray-500 text-sm mt-1">Conecte ferramentas externas e gerencie o acesso via API.</p>
                </div>
            </div>

            <Tabs defaultValue="apps">
                <TabsList>
                    <TabsTrigger value="apps" icon={<Plug size={16} />}>Apps Conectados</TabsTrigger>
                    <TabsTrigger value="webhooks" icon={<Webhook size={16} />}>Webhooks</TabsTrigger>
                    <TabsTrigger value="api" icon={<Key size={16} />}>API Keys</TabsTrigger>
                </TabsList>

                {/* --- APPS TAB --- */}
                <TabsContent value="apps">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {apps.map(app => (
                            <Card key={app.id} className="relative group overflow-hidden border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-4 rounded-xl bg-white/5 ${app.color} transition-colors group-hover:bg-white/10`}>
                                        {app.icon}
                                    </div>
                                    <div className={`
                                        px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                                        ${app.status === 'connected' ? 'bg-neon-green/10 text-neon-green border-neon-green/30' : 
                                          app.status === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 
                                          'bg-gray-500/10 text-gray-500 border-gray-500/30'}
                                    `}>
                                        {app.status === 'connected' ? 'Conectado' : app.status === 'error' ? 'Erro' : 'Desconectado'}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{app.name}</h3>
                                <p className="text-sm text-gray-400 mb-6 min-h-[40px]">{app.description}</p>
                                
                                <button 
                                    onClick={() => toggleAppStatus(app.id)}
                                    className={`
                                        w-full py-2 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-2
                                        ${app.status === 'connected' 
                                            ? 'bg-transparent border-white/10 text-gray-400 hover:text-white hover:bg-white/5' 
                                            : 'bg-neon-cyan text-dark-bg border-neon-cyan hover:bg-neon-blue hover:border-neon-blue'}
                                    `}
                                >
                                    {app.status === 'connected' ? 'Configurar / Desconectar' : 'Conectar Integração'}
                                </button>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* --- WEBHOOKS TAB --- */}
                <TabsContent value="webhooks">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* List */}
                        <div className="lg:col-span-2 space-y-4">
                            {webhooks.map(hook => (
                                <div key={hook.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-white/10 transition-all">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${hook.status === 'active' ? 'bg-neon-green shadow-[0_0_8px_#34FFB0]' : 'bg-red-500'}`}></span>
                                            <h4 className="font-mono text-sm text-gray-300 truncate">{hook.url}</h4>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>ID: {hook.id}</span>
                                            <span>•</span>
                                            <span>Eventos: {hook.events.join(', ')}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><RefreshCw size={10}/> {hook.lastTriggered}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Testar">
                                            <Network size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteWebhook(hook.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Remover"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {webhooks.length === 0 && (
                                <div className="text-center p-8 border border-dashed border-white/10 rounded-xl text-gray-500">
                                    Nenhum webhook configurado.
                                </div>
                            )}
                        </div>

                        {/* Create Form */}
                        <Card className="h-fit sticky top-24">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Plus size={18} className="text-neon-cyan"/> Novo Endpoint
                            </h3>
                            <form onSubmit={handleCreateWebhook} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">URL de Destino</label>
                                    <input 
                                        type="url" 
                                        placeholder="https://api.seusite.com/webhook" 
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none text-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Eventos</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['user.*', 'payment.*', 'agent.*'].map(evt => (
                                            <label key={evt} className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/5">
                                                <input type="checkbox" className="accent-neon-cyan" defaultChecked />
                                                <span className="text-xs text-gray-300 font-mono">{evt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded font-medium text-sm transition-colors border border-white/5">
                                    Adicionar Webhook
                                </button>
                            </form>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- API KEYS TAB --- */}
                <TabsContent value="api">
                    <div className="max-w-4xl">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-gray-400 text-sm">
                                Use estas chaves para autenticar requisições na nossa API REST. 
                                <br/>Nunca compartilhe suas chaves em client-side code.
                            </p>
                            <button 
                                onClick={() => setIsCreateKeyOpen(true)}
                                className="px-4 py-2 bg-neon-cyan text-dark-bg font-bold rounded text-sm hover:bg-neon-blue transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(124,252,243,0.2)]"
                            >
                                <Plus size={16} /> Gerar Nova Chave
                            </button>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="p-4">Nome</th>
                                        <th className="p-4">Prefixo da Chave</th>
                                        <th className="p-4">Criado em</th>
                                        <th className="p-4">Último uso</th>
                                        <th className="p-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {apiKeys.map(key => (
                                        <tr key={key.id} className="hover:bg-white/[0.04] transition-colors">
                                            <td className="p-4 font-medium text-white">{key.name}</td>
                                            <td className="p-4 font-mono text-gray-400 text-sm">{key.prefix}</td>
                                            <td className="p-4 text-sm text-gray-500">{key.createdAt}</td>
                                            <td className="p-4 text-sm text-gray-300">{key.lastUsed}</td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteKey(key.id)}
                                                    className="text-gray-500 hover:text-red-400 transition-colors p-2" 
                                                    title="Revogar Chave"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Create Key Modal */}
                    {isCreateKeyOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="w-full max-w-sm bg-[#111625] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">Nova Chave de API</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Nome da Chave</label>
                                            <input 
                                                type="text" 
                                                placeholder="Ex: Integração Mobile" 
                                                value={newKeyName}
                                                onChange={(e) => setNewKeyName(e.target.value)}
                                                autoFocus
                                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-neon-cyan focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-3 justify-end pt-2">
                                            <button 
                                                onClick={() => setIsCreateKeyOpen(false)}
                                                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={handleGenerateKey}
                                                className="px-4 py-2 bg-neon-cyan text-dark-bg font-bold rounded text-sm hover:bg-neon-blue"
                                            >
                                                Criar Chave
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Integrations;