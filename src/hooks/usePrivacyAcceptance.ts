import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { isLocalBackend } from "../lib/env";
import { PRIVACY_POLICY_VERSION } from "../lib/constants";
import type { UserSettingsRow } from "../types/db";

// userId es opcional: LoginScreen lo usa solo para escribir en el registro (sin sesión todavía, no hay
// nada que leer), mientras que App.tsx lo usa también para leer y detectar si el usuario aceptó una
// versión antigua de la política (o ninguna) y hay que bloquearle el acceso hasta que la reacepte.
export function usePrivacyAcceptance(userId?: string) {
  const [version, setVersion] = useState<string | null | undefined>(undefined); // undefined = aún sin consultar
  const [loading, setLoading] = useState(!isLocalBackend);

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
    setVersion(error ? null : ((data as UserSettingsRow | null)?.privacy_version ?? null));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const recordAcceptance = useCallback(async (targetUserId: string) => {
    if (isLocalBackend) {
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
    setVersion(PRIVACY_POLICY_VERSION);
  }, []);

  // Mientras no se sabe la versión guardada (fetch en marcha o sin userId todavía) no se pide
  // reaceptar: evita un parpadeo del modal bloqueante antes de conocer el dato real.
  const needsReacceptance = version !== undefined && version !== PRIVACY_POLICY_VERSION;

  return { needsReacceptance, loading, recordAcceptance };
}
