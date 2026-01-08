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
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validate Environment
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Server Error: Missing API_KEY in environment variables.");
      return new Response(
        JSON.stringify({ 
            error: "Server Configuration Error", 
            details: "API Key not found in server environment." 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse Request
    const { model, contents, config } = await request.json();

    // 3. Initialize Gemini Server-Side
    const ai = new GoogleGenAI({ apiKey });

    // 4. Call Google API
    // We use a safe fallback model if none is provided, though frontend usually provides one.
    const targetModel = model || 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: contents,
      config: config
    });

    // 5. Return Result securely
    // We only send back the text/data, not the key or sensitive headers
    return new Response(
      JSON.stringify({ 
        text: response.text,
        usage: {
            totalTokens: response.usageMetadata?.totalTokenCount || 0,
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            responseTokens: response.usageMetadata?.candidatesTokenCount || 0
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error("AI Proxy Error:", error);
    
    // Check for specific Google API errors to give better feedback
    const status = error.status || 500;
    let message = error.message || "Internal Server Error";

    if (message.includes("403")) message = "API Key Invalid or Blocked (Server-Side).";
    if (message.includes("429")) message = "Rate Limit Exceeded.";

    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}