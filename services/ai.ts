// MOCK AI SERVICE - Sem dependência de API KEY
// Retorna dados simulados para não quebrar a aplicação sem configuração.

export interface AgentChatResponse {
  text: string;
  usage: {
    promptTokens?: number;
    responseTokens?: number;
    totalTokens: number;
  };
}

export const generateDashboardInsight = async (metricsSummary: string): Promise<string> => {
  // Simula latência
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const insights = [
    "Crescimento de 12% no engajamento semanal indica forte adoção da nova feature.",
    "Atenção: Aumento no churn de contas Starter requer revisão do onboarding.",
    "Otimização de custos bem sucedida: uso de tokens estabilizado.",
    "Padrão de uso sugere oportunidade de upsell para o segmento Pro."
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
  // Simula latência
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    text: `[SIMULAÇÃO LOCAL] Recebi sua mensagem: "${newMessage}". \n\nComo estou rodando em modo offline (sem API Key), esta é uma resposta automática para validar o layout do chat. O agente ${uiModelName} está configurado com temperatura ${temperature}.`,
    usage: {
      totalTokens: 150,
      promptTokens: 50,
      responseTokens: 100
    }
  };
};