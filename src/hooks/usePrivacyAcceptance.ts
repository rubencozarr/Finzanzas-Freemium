import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { isLocalBackend } from "../lib/env";
import { PRIVACY_POLICY_VERSION } from "../lib/constants";
import type { UserSettingsRow } from "../types/db";

// userId es opcional: en el registro (LoginScreen) todavía no hay sesión, pero App.tsx SIEMPRE debe
// pasar su propia instancia de este hook (recordAcceptance) a LoginScreen en vez de que LoginScreen
// llame a usePrivacyAcceptance() por su cuenta — dos instancias separadas fue justo el bug: al
// registrarse con confirmación de email desactivada, signUp() deja sesión activa al instante, App.tsx
// desmonta LoginScreen y monta la app ya con SU PROPIA instancia (esta), que lanza su propio SELECT a
// user_settings. Si ese SELECT llega antes de que el UPSERT de recordAcceptance de la OTRA instancia
// (la de LoginScreen, ya muerta) termine, ve "sin fila todavía" y se queda pillado en needsReacceptance
// = true para siempre, porque el setVersion posterior de esa instancia muerta no actualiza nada real.
export function usePrivacyAcceptance(userId?: string) {
  const [version, setVersion] = useState<string | null | undefined>(undefined); // undefined = aún sin consultar
  const [loading, setLoading] = useState(!isLocalBackend);
  // true en cuanto recordAcceptance escribe con éxito, y ya no se desmarca en este montaje: evita que
  // un refetch automático que arrancó justo antes (la misma carrera del comentario de arriba, ahora ya
  // dentro de una única instancia compartida) pueda sobrescribir con una lectura obsoleta la aceptación
  // que se acaba de guardar de verdad.
  const acceptedRef = useRef(false);

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setVersion(PRIVACY_POLICY_VERSION);
      setLoading(false);
      return;
    }
    if (!userId) {
      setVersion(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSupabase().from("user_settings").select("*").eq("user_id", userId).maybeSingle();
    if (!acceptedRef.current) {
      setVersion(error ? null : ((data as UserSettingsRow | null)?.privacy_version ?? null));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const recordAcceptance = useCallback(async (targetUserId: string) => {
    if (isLocalBackend) {
      acceptedRef.current = true;
      setVersion(PRIVACY_POLICY_VERSION);
      return;
    }
    const { error } = await getSupabase()
      .from("user_settings")
      .upsert({
        user_id: targetUserId,
        privacy_accepted_at: new Date().toISOString(),
        privacy_version: PRIVACY_POLICY_VERSION,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
    acceptedRef.current = true;
    setVersion(PRIVACY_POLICY_VERSION);
    setLoading(false);
  }, []);

  // Mientras no se sabe la versión guardada (fetch en marcha o sin userId todavía) no se pide
  // reaceptar: evita un parpadeo del modal bloqueante antes de conocer el dato real.
  const needsReacceptance = version !== undefined && version !== PRIVACY_POLICY_VERSION;

  return { needsReacceptance, loading, recordAcceptance };
}
