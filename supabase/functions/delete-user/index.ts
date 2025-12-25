import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? "https://mzxczamhulpsvswojsod.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eGN6YW1odWxwc3Zzd29qc29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjYxMjY0NCwiZXhwIjoyMDgyMTg4NjQ0fQ.et0S0yS46jpUWAoZAtXQ9BUGYkL0-NCElHfMqqMsO10";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    const { userId } = await req.json()

    if (!userId) throw new Error('User ID is required')

    // 1. Deletar do Auth (Geralmente faz cascade, mas garantimos aqui)
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId)
    if (authError) throw authError

    // 2. Deletar da tabela clients (caso não tenha cascade configurado no banco)
    const { error: dbError } = await supabaseClient
      .from('clients')
      .delete()
      .eq('id', userId)
    
    if (dbError) console.error('DB Delete Error (might be cascaded already):', dbError)

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})