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

    // Map models to new names if necessary or use fallback
    let modelName = model;
    
    // Simple mapping logic based on guidelines if backend receives old model IDs
    if (!modelName || modelName.includes('gpt') || modelName === 'gemini-1.5-flash') {
        modelName = 'gemini-3-flash-preview';
    } else if (modelName.includes('claude') || modelName === 'gemini-1.5-pro') {
        modelName = 'gemini-3-pro-preview';
    }

    // Convert messages to contents format for the new SDK
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