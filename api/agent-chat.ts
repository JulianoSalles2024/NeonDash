import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const genAI = new GoogleGenerativeAI(apiKey);

    // Fallback para modelos estáveis se os nomes de preview não forem suportados diretamente
    const modelName = model || 'gemini-1.5-flash';

    const generativeModel = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt
    });

    // Converte mensagens para o formato do Gemini
    // Formato esperado: { role: 'user' | 'model', parts: [{ text: string }] }
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const result = await generativeModel.generateContent({
      contents: contents,
      generationConfig: {
        temperature: temperature || 0.7,
      }
    });

    const response = await result.response;
    const text = response.text();
    
    return new Response(
      JSON.stringify({ 
        text: text,
        usage: {
          // Extração segura de uso de tokens (se disponível na resposta)
          totalTokens: response.usageMetadata?.totalTokenCount || 0
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