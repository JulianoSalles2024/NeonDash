import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Server configuration missing");

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { email, password, name, company, plan, role } = await request.json();

    // 1. Create User in Supabase Auth (Admin)
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, company, role }
    });

    if (authError) throw authError;

    // 2. Insert into public.clients table
    if (authUser.user) {
      const { error: dbError } = await supabaseClient
        .from('clients')
        .insert({
          id: authUser.user.id,
          name,
          email,
          company,
          plan: plan || 'Starter',
          status: 'Novo', 
          mrr: 0,
          health_score: 100
        });

      if (dbError) {
        // Rollback
        await supabaseClient.auth.admin.deleteUser(authUser.user.id);
        throw dbError;
      }
    }

    return new Response(
      JSON.stringify({ user: authUser.user, message: 'User created successfully via Vercel' }),
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