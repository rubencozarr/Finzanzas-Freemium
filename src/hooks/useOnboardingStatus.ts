import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromUserSettingsRow } from "../lib/mappers";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { UserSettingsRow } from "../types/db";

const LOCAL_KEY = "onboardingCompleted";

// Vive en Supabase (tabla user_settings), no en localStorage: así el mismo usuario que ya completó
// el tutorial en un dispositivo no vuelve a verlo al entrar desde otro. En modo local solo hay un
// usuario mock por navegador, así que localStorage sigue siendo suficiente ahí.
export function useOnboardingStatus(userId: string | undefined) {
  const [completed, setCompleted] = useState<boolean>(() => (isLocalBackend ? readLocal<boolean>(LOCAL_KEY, false) : false));
  // A qué userId corresponde el `completed` actual (o "local" en modo local). Mientras no coincida
  // con el userId recibido, se considera loading. Esto se calcula en cada render comparando dos
  // valores de estado, en vez de con un useState propio actualizado desde el efecto de refetch: así
  // "loading" pasa a true en el MISMO render en que userId cambia de undefined a un id real, sin
  // depender de que el efecto de este hook llegue a ejecutarse antes que el de quien lo consume. Esa
  // dependencia del orden de efectos era la causa de que, al reabrir la PWA, App.tsx pudiera leer un
  // "loading: false" y un "completed: false" que en realidad venían de la fase previa sin usuario
  // (userId undefined), decidiendo mostrar el tour antes de que llegara el valor real de Supabase.
  const [fetchedForUserId, setFetchedForUserId] = useState<string | undefined | "local">(isLocalBackend ? "local" : undefined);
  const loading = isLocalBackend ? false : userId !== fetchedForUserId;

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setCompleted(readLocal<boolean>(LOCAL_KEY, false));
      return;
    }
    if (!userId) {
      setCompleted(false);
      setFetchedForUserId(undefined);
      return;
    }
    const { data, error } = await getSupabase().from("user_settings").select("*").eq("user_id", userId).maybeSingle();
    if (!error) setCompleted(fromUserSettingsRow(data as UserSettingsRow | null));
    setFetchedForUserId(userId);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const setOnboardingCompleted = useCallback(
    async (value: boolean) => {
      if (isLocalBackend) {
        setCompleted(value);
        writeLocal(LOCAL_KEY, value);
        return;
      }
      if (!userId) return;
      setCompleted(value);
      const { error } = await getSupabase()
        .from("user_settings")
        .upsert({ user_id: userId, onboarding_completed: value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    [userId],
  );

  return { completed, loading, setOnboardingCompleted, refetch };
}
