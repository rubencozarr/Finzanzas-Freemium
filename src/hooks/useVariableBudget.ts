import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromVariableBudgetRow } from "../lib/mappers";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { VariableBudgetRow } from "../types/db";

const LOCAL_KEY = "variableBudget";

export function useVariableBudget(userId: string | undefined) {
  const [variableBudget, setVariableBudget] = useState<number>(() => (isLocalBackend ? readLocal<number>(LOCAL_KEY, 0) : 0));
  const [loading, setLoading] = useState(!isLocalBackend);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setVariableBudget(readLocal<number>(LOCAL_KEY, 0));
      setLoading(false);
      return;
    }
    if (!userId) {
      setVariableBudget(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSupabase().from("variable_budget").select("*").eq("user_id", userId).maybeSingle();
    if (error) setError(error.message);
    else setVariableBudget(fromVariableBudgetRow(data as VariableBudgetRow | null));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateVariableBudget = useCallback(
    async (amount: number) => {
      if (isLocalBackend) {
        setVariableBudget(amount);
        writeLocal(LOCAL_KEY, amount);
        return;
      }
      if (!userId) return;
      const { error } = await getSupabase()
        .from("variable_budget")
        .upsert({ user_id: userId, amount, updated_at: new Date().toISOString() });
      if (error) throw error;
      await refetch();
    },
    [userId, refetch],
  );

  return { variableBudget, loading, error, updateVariableBudget, refetch };
}
