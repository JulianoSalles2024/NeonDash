// Map UI model names to standard Gemini model IDs.
const MODEL_MAPPING: Record<string, string> = {
  'GPT-4o': 'gemini-3-pro-preview', // High intelligence
  'Claude 3.5 Sonnet': 'gemini-3-pro-preview',
  'GPT-3.5 Turbo': 'gemini-3-flash-preview', // Fast & Cheap
  'Claude 3 Haiku': 'gemini-3-flash-preview',
  'gemini-1.5-pro': 'gemini-3-pro-preview',
  'gemini-1.5-flash': 'gemini-3-flash-preview',
  'gpt-4o': 'gemini-3-pro-preview',
  'gpt-3.5-turbo': 'gemini-3-flash-preview',
};

export interface AgentChatResponse {
  text: string;
  usage: {
    promptTokens?: number;
    responseTokens?: number;
    totalTokens: number;
  };
}

// Helper function to call our serverless function
const callAiEndpoint = async (payload: any): Promise<AgentChatResponse> => {
  const response = await fetch('/api/agent-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na API: ${response.status}`);
  }

  return await response.json();
};

export const generateDashboardInsight = async (metricsSummary: string): Promise<string> => {
  try {
    const response = await callAiEndpoint({
      model: 'gemini-3-flash-preview', // Use cheap/fast model for insights
      systemPrompt: `
        Atue como um analista de dados sênior para um SaaS executivo.
        Analise o resumo de métricas fornecido.
        Gere UM ÚNICO insight estratégico de alto impacto (máximo de 15 a 20 palavras).
        Foque em anomalias, oportunidades de crescimento ou riscos de churn.
        O tom deve ser profissional, direto e em Português.
        Não use markdown, apenas texto puro.
      `,
      messages: [{ role: 'user', content: metricsSummary }],
      temperature: 0.5
    });
    
    return response.text || "Análise indisponível no momento.";
  } catch (error) {
    console.error("Dashboard Insight Error:", error);
    return "Insights indisponíveis (Erro de conexão).";
  }
};

export const generateAgentChat = async (
  uiModelName: string,
  systemPrompt: string,
  temperature: number,
  history: { role: 'user' | 'assistant'; content: string }[],
  newMessage: string
): Promise<AgentChatResponse> => {
  try {
    // 1. Resolve actual model ID (Default to Flash if unknown)
    const modelId = MODEL_MAPPING[uiModelName] || MODEL_MAPPING[uiModelName.toLowerCase()] || 'gemini-3-flash-preview';

    // 2. Prepare payload for Serverless Function
    const payload = {
      model: modelId,
      systemPrompt: systemPrompt,
      temperature: temperature,
      messages: [
        ...history,
        { role: 'user', content: newMessage }
      ],
    };

    // 3. Call API
    return await callAiEndpoint(payload);

  } catch (error: any) {
    console.error("Agent Chat Error:", error);
    throw error;
  }
};