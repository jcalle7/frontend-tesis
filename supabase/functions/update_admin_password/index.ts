/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173", 
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { company_id, new_password } = await req.json();

    if (!company_id || !new_password) {
      return new Response(JSON.stringify({ error: "Faltan parámetros." }), {
        status: 400,
        headers: corsHeaders,
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
        headers: corsHeaders,
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
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message :
      typeof err === "string" ? err :
      JSON.stringify(err);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
