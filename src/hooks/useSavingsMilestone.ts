import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromSavingsMilestoneRow } from "../lib/mappers";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { UserSettingsRow } from "../types/db";

const LOCAL_KEY = "savingsMilestoneShown";

// Flag independiente de useOnboardingStatus aunque viva en la misma fila de user_settings: ese hook
// ya tiene una lógica delicada (fetchedForUserId) para evitar una race condition ya arreglada al
// reabrir la PWA, y no conviene mezclarle una responsabilidad distinta.
export function useSavingsMilestone(userId: string | undefined) {
  const [shown, setShown] = useState<boolean>(() => (isLocalBackend ? readLocal<boolean>(LOCAL_KEY, false) : false));
  // Antes de que la consulta a Supabase responda, "shown" empieza en false por DEFECTO, no porque la
  // fila realmente diga que no se ha mostrado. Sin este loading, el aviso de App.tsx (que solo mira
  // "shown") podía disparar con ese false provisional si funds/transactions ya habían cargado y sumaban
  // ≥500€ — y como esto se repite en cada recarga (el estado inicial siempre vuelve a false hasta que
  // la consulta real responde), el aviso podía reaparecer cada vez en vez de solo la primera vez.
  const [loading, setLoading] = useState(!isLocalBackend);

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setShown(readLocal<boolean>(LOCAL_KEY, false));
      setLoading(false);
      return;
    }
    if (!userId) {
      setShown(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSupabase().from("user_settings").select("*").eq("user_id", userId).maybeSingle();
    if (!error) setShown(fromSavingsMilestoneRow(data as UserSettingsRow | null));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const markShown = useCallback(async () => {
    if (isLocalBackend) {
      setShown(true);
      writeLocal(LOCAL_KEY, true);
      return;
    }
    if (!userId) return;
    setShown(true);
    const { error } = await getSupabase()
      .from("user_settings")
      .upsert({ user_id: userId, savings_milestone_shown: true, updated_at: new Date().toISOString() });
    if (error) throw error;
  }, [userId]);

  return { shown, loading, markShown, refetch };
}
