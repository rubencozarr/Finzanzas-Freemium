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

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setShown(readLocal<boolean>(LOCAL_KEY, false));
      return;
    }
    if (!userId) {
      setShown(false);
      return;
    }
    const { data, error } = await getSupabase().from("user_settings").select("*").eq("user_id", userId).maybeSingle();
    if (!error) setShown(fromSavingsMilestoneRow(data as UserSettingsRow | null));
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

  return { shown, markShown, refetch };
}
