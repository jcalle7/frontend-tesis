/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173", // Cambiar en producción
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { client, password } = body;

    const supabase = createClient(
      Deno.env.get("SB_URL")!,
      Deno.env.get("SB_SERVICE_ROLE")!
    );

    console.log("ENV Vars =>", {
      SB_URL: Deno.env.get("SB_URL"),
      SB_SERVICE_ROLE: Deno.env.get("SB_SERVICE_ROLE")
    });

    // Verificar si ya existe ese correo en la tabla clients
    const { data: existingUser } = await supabase
      .from("clients")
      .select("id")
      .eq("email", client.email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "❌ Ya existe un cliente con ese correo." }),
        { status: 409, headers: corsHeaders }
      );
    }

    // Crear el usuario en Supabase Auth
    const { data: _authUser, error: authError } = await supabase.auth.admin.createUser({
      email: client.email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("User already registered")) {
        return new Response(
          JSON.stringify({ error: "❌ El usuario ya está registrado en Auth." }),
          { status: 409, headers: corsHeaders }
        );
      }
      return new Response(
        JSON.stringify({ error: authError.message || "❌ Error creando usuario." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Obtener el role_id del rol "cliente"
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "cliente")
      .single();

    if (roleError || !role?.id) {
      return new Response(
        JSON.stringify({ error: "❌ No se pudo obtener el role_id del rol 'cliente'." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Insertar cliente en la tabla clients
    const { error: insertError } = await supabase.from("clients").insert([{
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone,
      email: client.email,
      comments: client.comments,
      company_id: client.company_id,
      role_id: role.id,
    }]);

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({ message: "✅ Cliente registrado correctamente." }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : JSON.stringify(err);

    return new Response(JSON.stringify({ error: "💥 Error interno: " + message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
