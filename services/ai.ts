import { AgentChatResponse } from '../types';

// Helper function to call our secure backend proxy
const callAIProxy = async (payload: any) => {
    try {
        const response = await fetch('/api/ai-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};

const getGeminiModelName = (uiModel: string) => {
    const lowerModel = (uiModel || '').toLowerCase();
    if (lowerModel.includes('gpt-4') || lowerModel.includes('gemini-pro') || lowerModel.includes('sonnet')) {
        return 'gemini-3-pro-preview';
    } 
    return 'gemini-3-flash-preview';
};

export const generateDashboardInsight = async (metricsSummary: string): Promise<string> => {
  try {
    const result = await callAIProxy({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: metricsSummary }] }],
        config: {
            systemInstruction: 'Você é um analista de dados SaaS experiente. Analise o contexto fornecido e gere UM ÚNICO insight curto (máximo 1 frase) e acionável. Foque em tendências, riscos ou oportunidades. Use emojis.',
            temperature: 0.7
        }
    });

    return result.text || "Sem insights disponíveis.";

  } catch (error) {
    console.warn("AI Insight Error:", error);
    return "⚠️ IA indisponível. Verifique conexão.";
  }
};

export const analyzeJourney = async (
    userName: string,
    daysSinceJoined: number,
    currentStage: string,
    daysStagnant: number,
    completedSteps: string[]
): Promise<string> => {
    try {
        const prompt = `
            Analise a jornada do cliente SaaS "${userName}" para identificar gargalos ou sucessos.
            
            DADOS:
            - Tempo de casa: ${daysSinceJoined} dias.
            - Estágio Atual (Travado em): ${currentStage}.
            - Dias sem avançar (Estagnação): ${daysStagnant} dias.
            - Etapas Feitas: ${completedSteps.join(', ')}.

            REGRAS OBRIGATÓRIAS:
            1. ESTAGNAÇÃO CRÍTICA: Se dias estagnado > 15, comece com "🚨 ALERTA DE ESTAGNAÇÃO:". Sugira intervenção manual (ligação/reunião).
            2. PROVA SOCIAL: Se completou "Valor Gerado" ou jornada completa, comece com "💎 OPORTUNIDADE DE CASE:". Sugira pedir depoimento.
            3. NORMAL: Se tudo ok, dê uma dica tática para o próximo passo.

            Seja curto (máximo 2 frases). Direto ao ponto.
        `;
        
        const result = await callAIProxy({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                temperature: 0.4 
            }
        });

        return result.text || "Análise indisponível no momento.";

    } catch (error) {
        console.error("AI Journey Analysis Error:", error);
        return "Não foi possível gerar o diagnóstico automático.";
    }
};

export const generateAgentChat = async (
  uiModelName: string,
  systemPrompt: string,
  temperature: number,
  history: { role: 'user' | 'assistant'; content: string }[],
  newMessage: string
): Promise<AgentChatResponse> => {
  
  const modelName = getGeminiModelName(uiModelName);

  const contents = history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  contents.push({
      role: 'user',
      parts: [{ text: newMessage }]
  });

  try {
      const result = await callAIProxy({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: temperature || 0.7,
        }
      });

      return {
        text: result.text || "O modelo não retornou texto.",
        usage: result.usage || { totalTokens: 0, promptTokens: 0, responseTokens: 0 }
      };
  } catch (error: any) {
      console.error("Agent Execution Error Details:", error);
      throw new Error(`Erro na IA: ${error.message || 'Falha de comunicação com o servidor'}`);
  }
};