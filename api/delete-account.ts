/// <reference types="node" />
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Función serverless de Vercel (mismo patrón Request/Response que api/lemonsqueezy-webhook.ts).
// supabase.auth.admin.deleteUser() SOLO existe en el SDK con la service role key (nunca puede llamarse
// desde el cliente, ahí solo hay la anon key) — de ahí que esto tenga que vivir en el servidor.
//
// Identidad: el user_id a borrar se obtiene validando el propio token de sesión del que hace la
// petición (Authorization: Bearer <access_token>), nunca de un user_id que mande el cliente en el
// body — si no, cualquiera podría pedir el borrado de la cuenta de otra persona con solo conocer su id.
//
// Cascada: todas las tablas de datos del usuario (transactions, funds, categories, recurring,
// recurring_income, assets, investment_config, variable_budget, user_settings, subscriptions) tienen
// su user_id con "references auth.users (id) on delete cascade" en supabase/schema.sql, así que borrar
// el usuario de auth.users ya se lleva por delante TODOS sus datos de una vez — no hace falta (ni
// conviene, por riesgo de quedar a medias) borrar tabla por tabla a mano desde aquí.

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!accessToken) {
    return json({ error: "Falta el token de sesión." }, 401);
  }

  let admin: SupabaseClient;
  try {
    admin = getSupabaseAdmin();
  } catch (err) {
    console.error("delete-account: configuración incompleta", err);
    return json({ error: "Configuración del servidor incompleta." }, 500);
  }

  // Válida contra el propio Auth de Supabase: si el token es correcto, esto es exactamente quién dice
  // ser el que hace la petición (no se puede falsificar sin el secreto de firma del proyecto).
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return json({ error: "Sesión no válida." }, 401);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    console.error("delete-account: error eliminando el usuario", deleteError);
    return json({ error: "No se pudo eliminar la cuenta." }, 500);
  }

  return json({ ok: true }, 200);
}
