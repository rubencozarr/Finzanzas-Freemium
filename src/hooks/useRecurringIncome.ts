import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromRecurringIncomeRow } from "../lib/mappers";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { RecurringIncomeRow } from "../types/db";
import type { RecurringIncome } from "../types";

const LOCAL_KEY = "recurringIncome";

export type NewRecurringIncome = Omit<RecurringIncome, "id">;

export function useRecurringIncome(userId: string | undefined) {
  const [recurringIncome, setRecurringIncome] = useState<RecurringIncome[]>(() =>
    isLocalBackend ? readLocal<RecurringIncome[]>(LOCAL_KEY, []) : [],
  );
  const [loading, setLoading] = useState(!isLocalBackend);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setRecurringIncome(readLocal<RecurringIncome[]>(LOCAL_KEY, []));
      setLoading(false);
      return;
    }
    if (!userId) {
      setRecurringIncome([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSupabase()
      .from("recurring_income")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setRecurringIncome(((data as RecurringIncomeRow[]) ?? []).map(fromRecurringIncomeRow));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addRecurringIncome = useCallback(
    async (r: NewRecurringIncome) => {
      if (isLocalBackend) {
        setRecurringIncome((prev) => {
          const next = [...prev, { id: crypto.randomUUID(), ...r }];
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      if (!userId) return;
      const { error } = await getSupabase().from("recurring_income").insert({
        user_id: userId,
        income_cat: r.incomeCat,
        name: r.name,
        amount: r.amount,
        note: r.note,
        day: r.day,
      });
      if (error) throw error;
      await refetch();
    },
    [userId, refetch],
  );

  const removeRecurringIncome = useCallback(
    async (id: string) => {
      if (isLocalBackend) {
        setRecurringIncome((prev) => {
          const next = prev.filter((r) => r.id !== id);
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("recurring_income").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const updateRecurringIncomeAmount = useCallback(
    async (id: string, amount: number) => {
      if (isLocalBackend) {
        setRecurringIncome((prev) => {
          const next = prev.map((r) => (r.id === id ? { ...r, amount } : r));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("recurring_income").update({ amount }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  return {
    recurringIncome,
    loading,
    error,
    addRecurringIncome,
    removeRecurringIncome,
    updateRecurringIncomeAmount,
    refetch,
  };
}
