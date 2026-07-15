import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromActiveSelectionLocksRow } from "../lib/mappers";
import { firstOfNextMonthISO } from "../lib/format";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { UserSettingsRow } from "../types/db";

const FUNDS_LOCAL_KEY = "activeFundsLockedUntil";
const CATEGORIES_LOCAL_KEY = "activeCategoriesLockedUntil";

// Bloqueo mensual de "fondos/categorías activas" para free con más elementos que su límite (downgrade
// o importación): en cuanto la selección se usa por primera vez en el mes, queda fijada hasta el día 1
// del mes siguiente. Vive en user_settings, no en localStorage en modo Supabase, igual que
// useOnboardingStatus/useSavingsMilestone. Usa el mismo guard fetchedForUserId que useOnboardingStatus
// para evitar la misma race condition ya documentada ahí al reabrir la PWA.
export function useActiveSelectionLocks(userId: string | undefined) {
  const [fundsLockedUntil, setFundsLockedUntil] = useState<string | null>(() =>
    isLocalBackend ? readLocal<string | null>(FUNDS_LOCAL_KEY, null) : null,
  );
  const [categoriesLockedUntil, setCategoriesLockedUntil] = useState<string | null>(() =>
    isLocalBackend ? readLocal<string | null>(CATEGORIES_LOCAL_KEY, null) : null,
  );
  const [fetchedForUserId, setFetchedForUserId] = useState<string | undefined | "local">(isLocalBackend ? "local" : undefined);
  const loading = isLocalBackend ? false : userId !== fetchedForUserId;

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setFundsLockedUntil(readLocal<string | null>(FUNDS_LOCAL_KEY, null));
      setCategoriesLockedUntil(readLocal<string | null>(CATEGORIES_LOCAL_KEY, null));
      return;
    }
    if (!userId) {
      setFundsLockedUntil(null);
      setCategoriesLockedUntil(null);
      setFetchedForUserId(undefined);
      return;
    }
    const { data, error } = await getSupabase().from("user_settings").select("*").eq("user_id", userId).maybeSingle();
    if (!error) {
      const locks = fromActiveSelectionLocksRow(data as UserSettingsRow | null);
      setFundsLockedUntil(locks.fundsLockedUntil);
      setCategoriesLockedUntil(locks.categoriesLockedUntil);
    }
    setFetchedForUserId(userId);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const setFundsLock = useCallback(
    async (value: string | null) => {
      if (isLocalBackend) {
        setFundsLockedUntil(value);
        writeLocal(FUNDS_LOCAL_KEY, value);
        return;
      }
      if (!userId) return;
      setFundsLockedUntil(value);
      const { error } = await getSupabase()
        .from("user_settings")
        .upsert({ user_id: userId, active_funds_locked_until: value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    [userId],
  );

  const setCategoriesLock = useCallback(
    async (value: string | null) => {
      if (isLocalBackend) {
        setCategoriesLockedUntil(value);
        writeLocal(CATEGORIES_LOCAL_KEY, value);
        return;
      }
      if (!userId) return;
      setCategoriesLockedUntil(value);
      const { error } = await getSupabase()
        .from("user_settings")
        .upsert({ user_id: userId, active_categories_locked_until: value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    [userId],
  );

  const lockFundsUntilNextMonth = useCallback(() => setFundsLock(firstOfNextMonthISO()), [setFundsLock]);
  const lockCategoriesUntilNextMonth = useCallback(() => setCategoriesLock(firstOfNextMonthISO()), [setCategoriesLock]);
  const clearFundsLock = useCallback(() => setFundsLock(null), [setFundsLock]);
  const clearCategoriesLock = useCallback(() => setCategoriesLock(null), [setCategoriesLock]);

  return {
    fundsLockedUntil,
    categoriesLockedUntil,
    loading,
    lockFundsUntilNextMonth,
    lockCategoriesUntilNextMonth,
    clearFundsLock,
    clearCategoriesLock,
    refetch,
  };
}
