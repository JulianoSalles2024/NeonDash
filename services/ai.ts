import { GoogleGenAI } from "@google/genai";
import { AgentChatResponse } from '../types';

// Helper para obter a chave de forma segura
const getApiKey = () => {
  // O Vite substitui 'process.env.API_KEY' pelo valor string definido no vite.config.ts
  const key = process.env.API_KEY;
  
  // Fallback visual/debug caso a injeção falhe completamente (raro com a config atualizada)
  if (!key || key.includes("undefined")) {
    console.error("CRITICAL ERROR: API Key is missing or undefined in the browser bundle.");
    console.error("Please restart the Vite server using 'npm run dev' to reload config.");
    return null;
  }
  return key;
};

// Helper para mapear modelos de UI (GPT/Claude) para modelos reais do Gemini
const getGeminiModelName = (uiModel: string) => {
    const lowerModel = (uiModel || '').toLowerCase();
    
    // 1. Tarefas Complexas / Raciocínio -> Gemini 3 Pro
    if (
        lowerModel.includes('gpt-4') || 
        lowerModel.includes('claude-3-opus') || 
        lowerModel.includes('gemini-pro') ||
        lowerModel.includes('sonnet') ||
        lowerModel.includes('mistral-large')
    ) {
        return 'gemini-3-pro-preview';
    } 
    // 2. Tarefas Rápidas / Simples -> Gemini 3 Flash
    else if (
        lowerModel.includes('gpt-3.5') || 
        lowerModel.includes('haiku') || 
        lowerModel.includes('flash') || 
        lowerModel.includes('mini')
    ) {
        return 'gemini-3-flash-preview';
    }
    
    return 'gemini-3-flash-preview';
};

export const generateDashboardInsight = async (metricsSummary: string): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return "⚠️ API Key não detectada. Reinicie o servidor local.";

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
    return "⚠️ IA indisponível. Verifique conexão.";
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
      throw new Error("Chave de API não configurada. Verifique o console.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = getGeminiModelName(uiModelName);

  console.log(`[Agent] Sending request to ${modelName}...`);

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
      
      // Tratamento de erros comuns
      let errorMessage = error.message || 'Falha desconhecida';
      if (errorMessage.includes('403')) errorMessage = 'Chave de API inválida ou expirada.';
      if (errorMessage.includes('429')) errorMessage = 'Limite de requisições excedido.';
      if (errorMessage.includes('not found')) errorMessage = `Modelo ${modelName} não encontrado.`;

      throw new Error(`Erro na IA: ${errorMessage}`);
  }
};