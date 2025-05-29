import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // o "http://localhost:5173"
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

serve(async (req) => {
  // 1. Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  // 2. Parseo del body
  const body = await req.json();
  const { company, admin } = body;

  // 3. Supabase client
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 4. Crear usuario
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: admin.email,
    password: admin.password,
  });

  if (userError) {
    return new Response(JSON.stringify({ error: userError.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const userId = userData.user?.id;
  if (!userId) {
    return new Response(JSON.stringify({ error: "No se obtuvo el ID del usuario" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // 5. Crear empresa
  const { data: companyData, error: companyError } = await supabase
    .from("companies")
    .insert([company])
    .select()
    .single();

  if (companyError) {
    return new Response(JSON.stringify({ error: companyError.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // 6. Relacionar
  const { error: relationError } = await supabase
    .from("company_users")
    .insert([{
      user_id: userId,
      company_id: companyData.id,
      role: "admin",
    }]);

  if (relationError) {
    return new Response(JSON.stringify({ error: relationError.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ message: "✅ Empresa y admin creados" }), {
    status: 200,
    headers: corsHeaders,
  });
});
