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

    const { email, name, company, plan } = await req.json()

    // 1. Enviar convite via Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      data: { name, company }
    })

    if (authError) throw authError

    // 2. Pré-criar perfil na tabela clients para aparecer no dashboard
    if (authData.user) {
       const { error: dbError } = await supabaseClient
        .from('clients')
        .upsert({
          id: authData.user.id,
          name,
          email,
          company,
          plan: plan || 'Starter',
          status: 'Novo', // Indica convidado mas não ativo
          mrr: 0,
          health_score: 50 // Score neutro para novos convites
        })

       if (dbError) throw dbError
    }

    return new Response(
      JSON.stringify({ message: 'Invitation sent', user: authData.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})