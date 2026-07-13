import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromSubscriptionRow } from "../lib/mappers";
import { isLocalBackend } from "../lib/env";
import { FREE_HISTORY_MONTHS, FREE_MAX_CATEGORIES, FREE_MAX_FUNDS } from "../lib/constants";
import type { SubscriptionRow } from "../types/db";
import type { CategoryType, SubscriptionPlan } from "../types";

// El plan vive en Supabase (tabla subscriptions), no en localStorage: así el mismo usuario ve el
// mismo plan en cualquier dispositivo. Sigue el mismo patrón que useOnboardingStatus
// (fetchedForUserId en vez de un booleano propio) para evitar que, al reabrir la PWA, se lea un
// "loading: false" con el plan de la fase previa sin usuario todavía cargado.
export function useSubscription(userId: string | undefined) {
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [fetchedForUserId, setFetchedForUserId] = useState<string | undefined | "local">(isLocalBackend ? "local" : undefined);
  const loading = isLocalBackend ? false : userId !== fetchedForUserId;

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      // Modo local (sin proyecto Supabase): no hay tabla subscriptions que consultar, se asume free.
      setPlan("free");
      return;
    }
    if (!userId) {
      setPlan("free");
      setFetchedForUserId(undefined);
      return;
    }
    const { data, error } = await getSupabase().from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
    // Fail-closed: si la consulta falla, se trata como free en vez de conservar el plan anterior en
    // memoria (App no se desmonta al cambiar de cuenta en la misma pestaña, así que sin esto un error
    // de red/RLS podría dejar "pegado" el plan premium de una sesión previa).
    setPlan(error ? "free" : fromSubscriptionRow(data as SubscriptionRow | null));
    setFetchedForUserId(userId);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const isPremium = plan === "premium";

  const canCreateFund = useCallback((currentCount: number) => isPremium || currentCount < FREE_MAX_FUNDS, [isPremium]);

  const canCreateCategory = useCallback(
    (currentCount: number, type: CategoryType) => isPremium || currentCount < FREE_MAX_CATEGORIES[type],
    [isPremium],
  );

  const canAccessAnnual = useCallback(() => isPremium, [isPremium]);

  const canAccessInvestmentDetail = useCallback(() => isPremium, [isPremium]);

  const canUseSplitExpense = useCallback(() => isPremium, [isPremium]);

  const canNavigateToMonth = useCallback(
    (monthDate: Date) => {
      if (isPremium) return true;
      const now = new Date();
      const monthsAgo = (now.getFullYear() - monthDate.getFullYear()) * 12 + (now.getMonth() - monthDate.getMonth());
      return monthsAgo < FREE_HISTORY_MONTHS;
    },
    [isPremium],
  );

  return {
    plan,
    isPremium,
    loading,
    canCreateFund,
    canCreateCategory,
    canAccessAnnual,
    canAccessInvestmentDetail,
    canUseSplitExpense,
    canNavigateToMonth,
    refetch,
  };
}
