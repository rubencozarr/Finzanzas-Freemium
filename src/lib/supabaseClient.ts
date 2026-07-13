import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Crea el cliente Supabase de forma perezosa. Solo se llama en DATA_BACKEND === "supabase". */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env, rellena los valores de tu proyecto Supabase y pon VITE_DATA_BACKEND=supabase.",
    );
  }
  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
