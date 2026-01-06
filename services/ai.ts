import { GoogleGenAI } from "@google/genai";
import { AgentChatResponse } from '../types';

// Helper para obter a chave de forma segura
const getApiKey = () => {
  // Tenta obter via process.env (injetado pelo Vite)
  const key = process.env.API_KEY;
  if (!key) {
    console.error("CRITICAL: API_KEY is missing. Check your .env file and restart the server.");
    return null;
  }
  return key;
};

// Helper para mapear modelos de UI (GPT/Claude) para modelos reais do Gemini
const getGeminiModelName = (uiModel: string) => {
    const lowerModel = (uiModel || '').toLowerCase();
    
    // 1. Tarefas Complexas / Raciocínio -> Gemini 3 Pro (Equivalente GPT-4/Claude Opus)
    if (
        lowerModel.includes('gpt-4') || 
        lowerModel.includes('claude-3-opus') || 
        lowerModel.includes('gemini-pro') ||
        lowerModel.includes('sonnet') ||
        lowerModel.includes('mistral-large')
    ) {
        return 'gemini-3-pro-preview';
    } 
    // 2. Tarefas Rápidas / Simples -> Gemini 3 Flash (Equivalente GPT-3.5/Haiku)
    else if (
        lowerModel.includes('gpt-3.5') || 
        lowerModel.includes('haiku') || 
        lowerModel.includes('flash') || 
        lowerModel.includes('mini')
    ) {
        return 'gemini-3-flash-preview';
    }
    
    // Fallback padrão
    return 'gemini-3-flash-preview';
};

export const generateDashboardInsight = async (metricsSummary: string): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return "⚠️ Configuração necessária: Adicione API_KEY ao .env";

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
    return "⚠️ IA indisponível. Verifique o console.";
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
      throw new Error("Chave de API não configurada. Verifique o arquivo .env");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Mapeia o modelo selecionado na UI para um modelo Gemini compatível
  const modelName = getGeminiModelName(uiModelName);

  console.log(`[Agent] Executing with model: ${modelName} (mapped from ${uiModelName})`);

  // Converte histórico para o formato do Google SDK
  const contents = history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Adiciona a nova mensagem
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
        text: response.text || "Sem resposta do modelo.",
        usage: {
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          responseTokens: response.usageMetadata?.candidatesTokenCount || 0
        }
      };
  } catch (error: any) {
      console.error("Agent Execution Error Details:", error);
      throw new Error(`Erro na IA (${modelName}): ${error.message || 'Falha desconhecida'}`);
  }
};