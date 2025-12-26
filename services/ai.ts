// MOCK AI SERVICE - Totalmente offline
// Retorna respostas pré-programadas para garantir o funcionamento da UI sem API Key.

export interface AgentChatResponse {
  text: string;
  usage: {
    promptTokens?: number;
    responseTokens?: number;
    totalTokens: number;
  };
}

export const generateDashboardInsight = async (metricsSummary: string): Promise<string> => {
  // Simula latência de rede
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const insights = [
    "Tendência de alta: O engajamento aumentou 12% após a última atualização.",
    "Alerta: Detectamos 3 usuários Enterprise com padrão de risco de churn.",
    "Otimização: O custo por token reduziu 5% nas últimas 24h.",
    "Oportunidade: Segmento 'Starter' mostra alta demanda por upgrades."
  ];

  return insights[Math.floor(Math.random() * insights.length)];
};

export const generateAgentChat = async (
  uiModelName: string,
  systemPrompt: string,
  temperature: number,
  history: { role: 'user' | 'assistant'; content: string }[],
  newMessage: string
): Promise<AgentChatResponse> => {
  // Simula latência de processamento
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    text: `[RESPOSTA LOCAL] Recebi sua mensagem: "${newMessage}". \n\nEstou operando em modo offline para desenvolvimento. O agente ${uiModelName} (Temp: ${temperature}) responderia aqui normalmente.`,
    usage: {
      totalTokens: 150,
      promptTokens: 50,
      responseTokens: 100
    }
  };
};