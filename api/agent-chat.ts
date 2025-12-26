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
      return new Response(
        JSON.stringify({ 
            error: "API Key não configurada no ambiente Vercel (API_KEY).", 
            text: "Erro de Configuração: Adicione sua API_KEY nas variáveis de ambiente do Vercel." 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // --- SMART MODEL MAPPING ---
    // A UI permite selecionar GPT-4o, Claude, etc.
    // Como estamos usando apenas a chave do Google Gemini, precisamos mapear
    // essas escolhas para o equivalente mais próximo do Gemini para a chamada funcionar.
    
    let modelName = model || 'gemini-3-flash-preview';
    const lowerModel = modelName.toLowerCase();

    // 1. Complex/Reasoning Tasks -> Pro
    if (
        lowerModel.includes('gpt-4') || 
        lowerModel.includes('claude-3-opus') || 
        lowerModel.includes('gemini-pro') ||
        lowerModel.includes('sonnet') ||
        lowerModel.includes('mistral-large')
    ) {
        modelName = 'gemini-3-pro-preview';
    } 
    // 2. Fast/Simple Tasks -> Flash
    else if (
        lowerModel.includes('gpt-3.5') || 
        lowerModel.includes('haiku') || 
        lowerModel.includes('flash') || 
        lowerModel.includes('mini')
    ) {
        modelName = 'gemini-3-flash-preview';
    }
    // Default fallback is kept as whatever was passed if it matches none, 
    // but usually falls back to one of the above if the UI sends standard IDs.

    // Convert messages to contents format for the Google GenAI SDK
    // The SDK expects: { role: 'user' | 'model', parts: [{ text: string }] }
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: temperature || 0.7,
      }
    });

    const text = response.text;
    
    return new Response(
      JSON.stringify({ 
        text: text,
        usage: {
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