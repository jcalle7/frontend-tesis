/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: buildCors(origin) });
  }

  try {
    const { company_id, new_password } = await req.json();

    if (!company_id || !new_password) {
      return new Response(JSON.stringify({ error: "Faltan parámetros." }), {
        status: 400,
        headers:  buildCors(origin),
      });
    }


    console.log("SB_URL:", Deno.env.get("SB_URL"));
    console.log("SB_SERVICE_ROLE:", Deno.env.get("SB_SERVICE_ROLE") ? "OK" : "MISSING");
    const supabase = createClient(      
      Deno.env.get("SB_URL")!,
      Deno.env.get("SB_SERVICE_ROLE")!
    );

    // Obtener el user_id del admin asociado
    const { data: relation, error: relError } = await supabase
      .from("company_users")
      .select("user_id")
      .eq("company_id", company_id)
      .eq("role", "admin")
      .maybeSingle();

    if (relError || !relation?.user_id) {
      return new Response(JSON.stringify({ error: "Admin no encontrado." }), {
        status: 404,
        headers:  buildCors(origin),
      });
    }

    const { error: passError } = await supabase.auth.admin.updateUserById(
      relation.user_id,
      { password: new_password }
    );

    if (passError) {
      return new Response(JSON.stringify({ error: passError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({ message: "✅ Contraseña actualizada correctamente." }),
      { status: 200, headers:  buildCors(origin) }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message :
      typeof err === "string" ? err :
      JSON.stringify(err);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers:  buildCors(origin),
    });
  }
});
