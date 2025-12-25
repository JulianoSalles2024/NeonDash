import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function handler(request: Request) {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, model, systemPrompt, temperature } = await request.json();

    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      throw new Error('Configuração de API Key ausente no servidor (API_KEY).');
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Converte mensagens para o formato do Gemini
    // Formato esperado: { role: 'user' | 'model', parts: [{ text: string }] }
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Se houver prompt de sistema, ele vai na config
    // O modelo deve ser um modelo Gemini válido mapeado pelo frontend
    const response = await ai.models.generateContent({
      model: model || 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: temperature || 0.7,
      }
    });

    return new Response(
      JSON.stringify({ 
        text: response.text,
        usage: {
          // Gemini não retorna contagem exata de tokens na resposta padrão de texto simples da SDK nova de forma direta em usageMetadata as vezes, 
          // mas vamos simular ou extrair se disponível.
          // Para este exemplo simplificado, retornamos valores estimados ou extraídos se existirem no objeto bruto
          totalTokens: (response as any).usageMetadata?.totalTokenCount || 0
        } 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}