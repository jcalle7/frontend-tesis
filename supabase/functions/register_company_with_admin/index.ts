/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AdminUserAttributes } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://frontend-tesis-one.vercel.app",
];
function isAllowedOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return ALLOWED_ORIGINS.includes(origin) || url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}
function buildCors(origin: string) {
  const allow = isAllowedOrigin(origin) ? origin : "https://frontend-tesis-one.vercel.app";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
  };
}
  
serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";

  console.log("SB_URL is:", Deno.env.get("SB_URL"));
  console.log("SB_SERVICE_ROLE is:", Deno.env.get("SB_SERVICE_ROLE"));
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: buildCors(origin) });
  } 

  try {
    console.log("SB_URL is:", Deno.env.get("SB_URL"));
    console.log("SB_SERVICE_ROLE is:", Deno.env.get("SB_SERVICE_ROLE"));

    const body = await req.json();
    const { company, admin } = body;

    const supabase = createClient(Deno.env.get("SB_URL")!, Deno.env.get("SB_SERVICE_ROLE")!);

    const { data: existing, error: dupError } = await supabase
      .from("companies")
      .select("id")
      .or(`ruc.eq.${company.ruc},email.eq.${company.email}`)
      .limit(1);

    if (dupError)  {
      return new Response(JSON.stringify({ error: dupError.message }), {
        status: 400, headers: buildCors(origin),
      });
    }

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: "❌ Ya existe una empresa con ese RUC o email." }), {
        status: 409,
        headers:  buildCors(origin),
      });
    }
    
    console.log("Creando usuario con confirmación automática");
    const { data: userData, error: userError  } = await supabase.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true, 
    });

    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({
        error: userError?.message || "No se creó el usuario."
      }), {
        status: 400,
        headers: buildCors(origin),
      });
    }
    
    type ForcedUserAttributes = {
  email_confirmed_at: string;
};

type ExtendedAdminUserAttributes = AdminUserAttributes & {
  email_confirmed_at: string;
};

await supabase.auth.admin.updateUserById(
  userData.user.id,
  {
    email_confirmed_at: new Date().toISOString(),
  } as ExtendedAdminUserAttributes
);

    const userId = userData.user.id;

    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .insert([{        
        name: company.name,
        slug: company.slug, 
        owner_name: company.owner_name,
        ruc: company.ruc,
        phone: company.phone,
        email: company.email,
        address: company.address,}])
      .select()
      .single();

    if (companyError) {
      return new Response(JSON.stringify({ error: companyError.message }), {
        status: 400,
        headers: buildCors(origin),
      });
    }

    const { error: relationError } = await supabase
      .from("company_users")
      .insert([{
        user_id: userId,
        company_id: companyData.id,
        role: "admin"
      }]);

    if (relationError) {
      return new Response(JSON.stringify({ error: relationError.message }), {
        status: 400,
        headers: buildCors(origin),
      });
    }

    return new Response(JSON.stringify({
      message: "✅ Empresa y admin creados"
    }), {
      status: 200,
      headers: buildCors(origin),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message :
      typeof err === "string" ? err :
      JSON.stringify(err);

    return new Response(JSON.stringify({ error: "💥 Error interno: " + message }), {
      status: 500,
      headers: buildCors(origin),
    });
  }
});
