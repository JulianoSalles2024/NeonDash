import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createOpenAI } from "https://esm.sh/@ai-sdk/openai@0.0.60";
import { generateText } from "https://esm.sh/ai@3.4.0";

// Declare global Deno type to fix TypeScript error
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, model, systemPrompt, temperature } = await req.json()

    // Initialize OpenAI with key from Edge Function Secret
    const openai = createOpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') || '',
    });

    const result = await generateText({
      model: openai(model || 'gpt-3.5-turbo'),
      system: systemPrompt || 'You are a helpful assistant.',
      messages: messages,
      temperature: temperature || 0.7,
    });

    return new Response(
      JSON.stringify({ 
        text: result.text,
        usage: result.usage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})