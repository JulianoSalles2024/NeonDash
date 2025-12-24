import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { Bell, Lock, User, Palette } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';
import { useUserStore } from '../store/useUserStore';

const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <div 
        onClick={onClick}
        className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${active ? 'bg-neon-cyan' : 'bg-gray-700'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`}></div>
    </div>
);

const SettingRow = ({ icon: Icon, title, subtitle, active, onToggle }: any) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-lg text-gray-300">
                <Icon size={20} />
            </div>
            <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
        </div>
        <Toggle active={active} onClick={onToggle} />
    </div>
);

const Settings: React.FC = () => {
    const { addToast } = useToastStore();
    const { resetUsers } = useUserStore();
    
    // Simple local state to demonstrate interactivity
    const [settings, setSettings] = useState({
        publicProfile: true,
        highPerf: false,
        churnAlerts: true,
        weeklyReport: true,
        tokenAnomalies: false,
        twoFactor: true
    });

    const handleToggle = (key: keyof typeof settings, label: string) => {
        const newValue = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newValue }));
        
        // Show feedback
        addToast({
            type: 'info',
            title: newValue ? 'Configuração Ativada' : 'Configuração Desativada',
            message: `${label} foi ${newValue ? 'habilitado' : 'desabilitado'} com sucesso.`,
            duration: 2000
        });
    };

    const handleResetData = () => {
        if (window.confirm('Tem certeza? Isso apagará todas as alterações locais e restaurará os usuários de exemplo.')) {
            resetUsers();
            addToast({ 
                type: 'success', 
                title: 'Dados Restaurados', 
                message: 'A base de dados foi reiniciada para os valores padrão.' 
            });
        }
    };

    return (
        <div className="p-8 max-w-[1000px] mx-auto">
            <h1 className="text-3xl font-bold font-display text-white mb-8">Configurações</h1>

            <div className="space-y-8">
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Geral</h2>
                    <Card>
                        <SettingRow 
                            icon={User} 
                            title="Perfil Público" 
                            subtitle="Tornar seu perfil visível para outros membros da equipe" 
                            active={settings.publicProfile}
                            onToggle={() => handleToggle('publicProfile', 'Perfil Público')} 
                        />
                         <SettingRow 
                            icon={Palette} 
                            title="Modo de Alta Performance" 
                            subtitle="Reduzir animações para economizar bateria (Motion Reduced)" 
                            active={settings.highPerf}
                            onToggle={() => handleToggle('highPerf', 'Modo de Alta Performance')} 
                        />
                    </Card>
                </section>

                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Notificações</h2>
                    <Card>
                        <SettingRow 
                            icon={Bell} 
                            title="Alertas de Churn" 
                            subtitle="Receber email quando um usuário de alto valor entrar em risco" 
                            active={settings.churnAlerts}
                            onToggle={() => handleToggle('churnAlerts', 'Alertas de Churn')} 
                        />
                         <SettingRow 
                            icon={Bell} 
                            title="Resumo Semanal" 
                            subtitle="Relatório de performance toda segunda-feira" 
                            active={settings.weeklyReport}
                            onToggle={() => handleToggle('weeklyReport', 'Resumo Semanal')} 
                        />
                         <SettingRow 
                            icon={Bell} 
                            title="Anomalias de Tokens" 
                            subtitle="Alertar quando o consumo sair do padrão (+20%)" 
                            active={settings.tokenAnomalies}
                            onToggle={() => handleToggle('tokenAnomalies', 'Anomalias de Tokens')} 
                        />
                    </Card>
                </section>

                 <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Segurança</h2>
                    <Card>
                        <SettingRow 
                            icon={Lock} 
                            title="Autenticação de Dois Fatores (2FA)" 
                            subtitle="Camada extra de segurança para login" 
                            active={settings.twoFactor}
                            onToggle={() => handleToggle('twoFactor', '2FA')} 
                        />
                         <div className="py-4 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-red-400">Zona de Perigo</p>
                                <p className="text-xs text-gray-500">Ações irreversíveis</p>
                            </div>
                            <button 
                                onClick={handleResetData}
                                className="px-3 py-1.5 border border-red-500/30 bg-red-500/10 text-red-400 text-xs rounded hover:bg-red-500/20 transition-colors"
                            >
                                Resetar Dados
                            </button>
                         </div>
                    </Card>
                </section>
            </div>
        </div>
    );
};

export default Settings;