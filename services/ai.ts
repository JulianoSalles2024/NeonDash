import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client with the API key injected by Vite
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDashboardInsight = async (metricsSummary: string): Promise<string> => {
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
    // Return null to allow fallback to mock/static data handled by the component
    return "";
  }
};
