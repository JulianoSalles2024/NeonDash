import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// Initialize the OpenAI provider with Vercel Gateway configuration
// Using the key provided by the user
const apiKey = process.env.VERCEL_AI_API_KEY || "";

const openai = createOpenAI({
  apiKey: apiKey,
  baseURL: 'https://gateway.ai.vercel.dev/v1',
});

// Map UI model names to Gateway-compatible model IDs.
// We map high-intelligence models to gpt-4o and faster ones to gpt-3.5-turbo 
// to ensure compatibility with the standard OpenAI provider protocol used by the gateway.
const MODEL_MAPPING: Record<string, string> = {
  'GPT-4o': 'gpt-4o',
  'Claude 3.5 Sonnet': 'gpt-4o', // Mapping to GPT-4o as fallback for consistent Gateway access
  'GPT-3.5 Turbo': 'gpt-3.5-turbo',
  'Claude 3 Haiku': 'gpt-3.5-turbo', // Fallback
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
    console.warn("Vercel AI API Key is missing.");
    return "Insights indisponíveis (Chave API ausente).";
  }

  try {
    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'), // Use a fast, cheap model for background insights
      system: `
        Atue como um analista de dados sênior para um SaaS executivo.
        Analise o resumo de métricas fornecido.
        Gere UM ÚNICO insight estratégico de alto impacto (máximo de 15 a 20 palavras).
        Foque em anomalias, oportunidades de crescimento ou riscos de churn.
        O tom deve ser profissional, direto e em Português.
        Não use markdown, apenas texto puro.
      `,
      prompt: metricsSummary,
    });
    
    return text || "Análise indisponível no momento.";
  } catch (error) {
    console.error("Vercel AI SDK Error:", error);
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
    throw new Error("Chave de API do Vercel AI Gateway não configurada.");
  }

  try {
    // 1. Resolve actual model ID
    const modelId = MODEL_MAPPING[uiModelName] || 'gpt-3.5-turbo';

    // 2. Prepare messages (History + New Message)
    const convertedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 3. Call AI via Vercel SDK
    const { text, usage } = await generateText({
      model: openai(modelId),
      system: systemPrompt,
      temperature: temperature,
      messages: [
        ...convertedHistory,
        { role: 'user', content: newMessage }
      ],
    });

    // 4. Return formatted response
    return {
      text,
      usage: {
        promptTokens: usage.promptTokens,
        responseTokens: usage.completionTokens,
        totalTokens: usage.totalTokens
      }
    };

  } catch (error: any) {
    console.error("Agent Chat Error (Vercel SDK):", error);
    throw new Error("Falha na comunicação com a IA.");
  }
};