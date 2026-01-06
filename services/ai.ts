import { GoogleGenAI } from "@google/genai";
import { AgentChatResponse } from '../types';

// Inicializa o cliente GenAI com a chave do ambiente
// Nota: Em produção, idealmente isso ficaria no backend, mas para o Mission Control (Dashboard Admin),
// o uso client-side é aceitável para garantir funcionalidade imediata do simulador.
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY não encontrada. Verifique seu arquivo .env");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Helper para mapear modelos de UI (GPT/Claude) para modelos reais do Gemini
const getGeminiModelName = (uiModel: string) => {
    const lowerModel = (uiModel || '').toLowerCase();
    
    // 1. Complex/Reasoning Tasks -> Pro
    if (
        lowerModel.includes('gpt-4') || 
        lowerModel.includes('claude-3-opus') || 
        lowerModel.includes('gemini-pro') ||
        lowerModel.includes('sonnet') ||
        lowerModel.includes('mistral-large')
    ) {
        return 'gemini-3-pro-preview';
    } 
    // 2. Fast/Simple Tasks -> Flash
    else if (
        lowerModel.includes('gpt-3.5') || 
        lowerModel.includes('haiku') || 
        lowerModel.includes('flash') || 
        lowerModel.includes('mini')
    ) {
        return 'gemini-3-flash-preview';
    }
    
    // Default fallback
    return 'gemini-3-flash-preview';
};

export const generateDashboardInsight = async (metricsSummary: string): Promise<string> => {
  try {
    const ai = getAIClient();
    if (!ai) return "⚠️ API Key não configurada. Adicione API_KEY ao .env";

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
    return "⚠️ Serviço de IA indisponível no momento.";
  }
};

export const generateAgentChat = async (
  uiModelName: string,
  systemPrompt: string,
  temperature: number,
  history: { role: 'user' | 'assistant'; content: string }[],
  newMessage: string
): Promise<AgentChatResponse> => {
  
  const ai = getAIClient();
  if (!ai) {
      throw new Error("API Key não encontrada. Configure a variável de ambiente API_KEY.");
  }

  // Mapeia o modelo selecionado na UI para um modelo Gemini compatível
  const modelName = getGeminiModelName(uiModelName);

  // Converte histórico para o formato do Google SDK
  // O SDK espera: { role: 'user' | 'model', parts: [{ text: string }] }
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
      console.error("Agent Execution Error:", error);
      throw new Error(error.message || "Falha na execução do agente.");
  }
};