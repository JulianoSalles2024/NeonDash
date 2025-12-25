import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
// We allow empty string initialization, but check before generation
const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// Map UI model names to actual Gemini models
const MODEL_MAPPING: Record<string, string> = {
  'GPT-4o': 'gemini-3-pro-preview', // High intelligence
  'Claude 3.5 Sonnet': 'gemini-3-pro-preview', // High intelligence
  'GPT-3.5 Turbo': 'gemini-3-flash-preview', // Fast/Cheaper
  'Claude 3 Haiku': 'gemini-3-flash-preview', // Fast/Cheaper
};

export interface AgentChatResponse {
  text: string;
  usage: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
}

export const generateDashboardInsight = async (metricsSummary: string): Promise<string> => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return "";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Atue como um analista de dados sênior para um SaaS executivo.
        Analise o seguinte resumo de métricas: "${metricsSummary}".
        
        Gere UM ÚNICO insight estratégico de alto impacto (máximo de 15 a 20 palavras).
        Foque em anomalias, oportunidades de crescimento ou riscos de churn.
        O tom deve ser profissional, direto e em Português.
        Não use markdown, apenas texto puro.
      `,
    });
    
    return response.text || "Análise indisponível no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};

export const generateAgentChat = async (
  uiModelName: string,
  systemPrompt: string,
  temperature: number,
  history: { role: 'user' | 'assistant'; content: string }[],
  newMessage: string
): Promise<AgentChatResponse> => {
  if (!apiKey) {
    throw new Error("Chave de API do Gemini não configurada. Verifique seu arquivo .env");
  }

  try {
    // 1. Resolve actual model
    const actualModel = MODEL_MAPPING[uiModelName] || 'gemini-3-flash-preview';

    // 2. Convert history to Gemini format
    const chatHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // 3. Initialize Chat
    const chat = ai.chats.create({
      model: actualModel,
      history: chatHistory,
      config: {
        systemInstruction: systemPrompt,
        temperature: temperature,
        maxOutputTokens: 1000,
      }
    });

    // 4. Send Message
    const response = await chat.sendMessage({
      message: newMessage
    });

    // 5. Extract Data
    const text = response.text || "Sem resposta do modelo.";
    
    // Extract usage metadata if available, otherwise estimate
    const usageMetadata = response.usageMetadata;
    const promptTokens = usageMetadata?.promptTokenCount || (newMessage.length / 4);
    const responseTokens = usageMetadata?.candidatesTokenCount || (text.length / 4);

    return {
      text,
      usage: {
        promptTokens,
        responseTokens,
        totalTokens: promptTokens + responseTokens
      }
    };

  } catch (error: any) {
    console.error("Agent Chat Error:", error);
    if (error.message?.includes('API key')) {
        throw new Error("Chave de API inválida ou expirada.");
    }
    throw new Error("Falha na comunicação com a IA.");
  }
};