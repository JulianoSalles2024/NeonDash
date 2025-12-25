import React from 'react';
import { MOCK_AGENT_LOGS } from '../../constants';
import { AgentLog } from '../../types';
import { CheckCircle, AlertTriangle, Clock, Code, DollarSign, Database } from 'lucide-react';

const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'success': return <CheckCircle size={14} className="text-neon-green" />;
        case 'error': return <AlertTriangle size={14} className="text-red-500" />;
        case 'timeout': return <Clock size={14} className="text-yellow-500" />;
        default: return <div className="w-3 h-3 rounded-full bg-gray-500" />;
    }
};

const AgentLogs: React.FC = () => {
    return (
        <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="p-4">Status / Timestamp</th>
                        <th className="p-4 w-1/3">Input (Prompt)</th>
                        <th className="p-4 w-1/3">Output (Response)</th>
                        <th className="p-4 text-right">Métricas</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {MOCK_AGENT_LOGS.map((log: AgentLog) => (
                        <tr key={log.id} className="hover:bg-white/[0.04] transition-colors group cursor-pointer">
                            <td className="p-4 align-top">
                                <div className="flex items-center gap-3">
                                    <StatusIcon status={log.status} />
                                    <span className="text-sm font-mono text-gray-300">{log.timestamp}</span>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 font-mono ml-6">{log.id}</div>
                            </td>
                            <td className="p-4 align-top">
                                <p className="text-sm text-gray-300 line-clamp-2 group-hover:text-white transition-colors">{log.input}</p>
                            </td>
                            <td className="p-4 align-top">
                                <p className="text-sm text-gray-400 line-clamp-2 font-mono text-xs">{log.output}</p>
                            </td>
                            <td className="p-4 align-top text-right">
                                <div className="flex flex-col gap-1 items-end">
                                    <span className="text-xs text-gray-400 flex items-center gap-1"><Database size={10} /> {log.tokens} toks</span>
                                    <span className={`text-xs flex items-center gap-1 ${log.latency > 1000 ? 'text-yellow-500' : 'text-gray-400'}`}><Clock size={10} /> {log.latency}ms</span>
                                    <span className="text-xs text-neon-green flex items-center gap-1"><DollarSign size={10} /> ${log.cost}</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AgentLogs;