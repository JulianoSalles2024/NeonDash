import { useState, useEffect } from 'react';
import { MOCK_CRITICAL_STREAM } from '../constants';

export interface StreamEvent {
  id: string;
  level: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  timestamp: string;
  source: string;
  action?: string;
}

const TEMPLATES = [
    { level: 'info', title: 'Novo Login Detectado', description: 'Usuário Enterprise acessou via SSO (Okta).', source: 'Auth' },
    { level: 'warning', title: 'Latência Elevada', description: 'Resposta da API /v1/events excedeu 800ms.', source: 'Infra' },
    { level: 'success', title: 'Exportação Concluída', description: 'O job de exportação #4421 finalizou em 4s.', source: 'Worker' },
    { level: 'critical', title: 'Falha de Pagamento', description: 'Webhook do Stripe retornou 500.', source: 'Billing', action: 'Retry' },
    { level: 'info', title: 'Feature Ativada', description: 'Usuário ativou "Relatórios Avançados".', source: 'Product' },
    { level: 'warning', title: 'Quota Atingida', description: 'Cliente "Acme" atingiu 90% dos tokens.', source: 'Limits', action: 'Upsell' },
];

export const useEventStream = () => {
  const [events, setEvents] = useState<StreamEvent[]>(MOCK_CRITICAL_STREAM);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      // 30% chance to generate an event every tick
      if (Math.random() > 0.3) {
        const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
        const newEvent: StreamEvent = {
            id: Date.now().toString(),
            level: template.level as any,
            title: template.title,
            description: template.description,
            timestamp: 'Agora',
            source: template.source,
            action: template.action
        };

        setEvents(prev => [newEvent, ...prev].slice(0, 7)); // Keep only last 7 events
      }
    }, 2500); // Check every 2.5s

    return () => clearInterval(interval);
  }, [isPaused]);

  return { events, isPaused, setIsPaused, clearResolved: () => setEvents([]) };
};