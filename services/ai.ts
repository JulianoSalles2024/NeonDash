import { AgentChatResponse } from '../types';

export const generateDashboardInsight = async (metricsSummary: string): Promise<string> => {
  try {
    const response = await fetch('/api/agent-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview', // Modelo rápido para insights
        systemPrompt: 'Você é um analista de dados SaaS experiente. Analise o contexto fornecido e gere UM ÚNICO insight curto (máximo 1 frase) e acionável. Foque em tendências, riscos ou oportunidades. Use emojis.',
        messages: [{ role: 'user', content: metricsSummary }],
        temperature: 0.7
      }),
    });

    if (!response.ok) {
        throw new Error('Falha na API de Insights');
    }

    const data = await response.json();
    return data.text || "Sem insights disponíveis no momento.";

  } catch (error) {
    console.warn("AI Insight Error (Falling back to mock):", error);
    // Fallback silencioso para não quebrar a home
    const fallbacks = [
      "⚠️ Modo Offline: O engajamento parece estável, mas verifique a API Key.",
      "⚠️ Modo Offline: Monitore os usuários em risco de churn manualmente."
    ];
    return fallbacks[0];
  }
};

export const generateAgentChat = async (
  uiModelName: string,
  systemPrompt: string,
  temperature: number,
  history: { role: 'user' | 'assistant'; content: string }[],
  newMessage: string
): Promise<AgentChatResponse> => {
  
  // Prepara o histórico para envio
  // Adiciona a nova mensagem ao final do array para envio à API
  const messagesPayload = [
    ...history,
    { role: 'user', content: newMessage }
  ];

  const response = await fetch('/api/agent-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: uiModelName,
      systemPrompt: systemPrompt,
      messages: messagesPayload,
      temperature: temperature
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na API: ${response.status}`);
  }

  const data = await response.json();

  return {
    text: data.text,
    usage: {
      totalTokens: data.usage?.totalTokens || 0,
      promptTokens: 0, // A API do Gemini as vezes agrupa isso, simplificamos aqui
      responseTokens: 0
    }
  };
};