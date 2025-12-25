import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = process.env.SUPABASE_URL || "https://mzxczamhulpsvswojsod.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eGN6YW1odWxwc3Zzd29qc29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjYxMjY0NCwiZXhwIjoyMDgyMTg4NjQ0fQ.et0S0yS46jpUWAoZAtXQ9BUGYkL0-NCElHfMqqMsO10";

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { email, name, company, plan } = await request.json();

    // 1. Send invite
    const { data: authData, error: authError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      data: { name, company }
    });

    if (authError) throw authError;

    // 2. Pre-create profile
    if (authData.user) {
       const { error: dbError } = await supabaseClient
        .from('clients')
        .upsert({
          id: authData.user.id,
          name,
          email,
          company,
          plan: plan || 'Starter',
          status: 'Novo',
          mrr: 0,
          health_score: 50
        });

       if (dbError) throw dbError;
    }

    return new Response(
      JSON.stringify({ message: 'Invitation sent', user: authData.user }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}