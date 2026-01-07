import { GoogleGenAI } from "@google/genai";
import { AgentChatResponse } from '../types';

// CHAVE DE EMERGÊNCIA - Atualizada para o usuário
const EMERGENCY_API_KEY = "AIzaSyCZw7K0My40AgnMQFHz-YBdKq3XlAcIjTs";

const getApiKey = () => {
  const key = process.env.API_KEY || EMERGENCY_API_KEY;
  if (!key || key.includes("undefined")) {
    console.error("CRITICAL ERROR: API Key is missing.");
    return null;
  }
  return key;
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
    const apiKey = getApiKey();
    if (!apiKey) return "⚠️ Configuração incompleta da API.";

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: metricsSummary,
        config: {
            systemInstruction: 'Você é um analista de dados SaaS experiente. Analise o contexto fornecido e gere UM ÚNICO insight curto (máximo 1 frase) e acionável. Foque em tendências, riscos ou oportunidades. Use emojis.',
            temperature: 0.7
        }
    });

    return response.text || "Sem insights disponíveis.";

  } catch (error) {
    console.warn("AI Insight Error:", error);
    return "⚠️ IA indisponível. Tente recarregar.";
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
        const apiKey = getApiKey();
        if (!apiKey) return "⚠️ Configuração incompleta da API.";

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
            Analise a jornada do cliente SaaS "${userName}" para identificar gargalos de Customer Success.
            
            DADOS DO CLIENTE:
            - Tempo de casa (Lifespan): ${daysSinceJoined} dias.
            - Estágio Atual (Onde travou): ${currentStage}.
            - Dias estagnado neste estágio: ${daysStagnant} dias.
            - Etapas já concluídas: ${completedSteps.join(', ')}.

            REGRAS DE DIAGNÓSTICO (Use estritamente estas lógicas):
            1. Se travado em "Ativação" e dias estagnado > 7 -> "🚨 Problema de Onboarding: Cliente não entende a plataforma."
            2. Se "Ativação" completa mas travado em "Estruturação do Método" -> "⚠️ Problema de Clareza/Setup: UX ok, mas usuário não entende 'como aplicar' o método."
            3. Se "Execução Assistida" completa mas travado em "Valor Gerado" -> "💡 Sucesso Parcial: Produto sendo usado, mas não está gerando transformação clara (ROI)."
            4. Se dias estagnado > 20 -> "📉 Risco de Churn Silencioso: Falta de acompanhamento ou abandono."
            5. Se tudo fluindo rápido (< 3 dias por etapa) -> "✅ Adoção Acelerada: Oferecer Upsell ou Case de Sucesso."

            SAÍDA ESPERADA:
            Gere apenas o diagnóstico curto (máximo 2 frases).
            Comece com o Emoji correspondente.
            Seja direto e sugira a próxima ação operacional.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                temperature: 0.4 // Baixa temperatura para ser mais analítico e seguir as regras
            }
        });

        return response.text || "Análise indisponível no momento.";

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
  
  const apiKey = getApiKey();
  if (!apiKey) {
      throw new Error("Chave de API não encontrada.");
  }

  const ai = new GoogleGenAI({ apiKey });
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
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: temperature || 0.7,
        }
      });

      return {
        text: response.text || "O modelo não retornou texto.",
        usage: {
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          responseTokens: response.usageMetadata?.candidatesTokenCount || 0
        }
      };
  } catch (error: any) {
      console.error("Agent Execution Error Details:", error);
      let errorMessage = error.message || 'Falha desconhecida';
      if (errorMessage.includes('403')) errorMessage = 'Chave de API inválida ou expirada.';
      if (errorMessage.includes('429')) errorMessage = 'Limite de requisições excedido.';
      if (errorMessage.includes('not found')) errorMessage = `Modelo ${modelName} não encontrado.`;

      throw new Error(`Erro na IA: ${errorMessage}`);
  }
};