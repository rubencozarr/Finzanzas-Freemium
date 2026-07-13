import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromRecurringRow } from "../lib/mappers";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { RecurringRow } from "../types/db";
import type { Recurring } from "../types";

const LOCAL_KEY = "recurring";

export type NewRecurring = Omit<Recurring, "id">;

export function useRecurring(userId: string | undefined) {
  const [recurring, setRecurring] = useState<Recurring[]>(() => (isLocalBackend ? readLocal<Recurring[]>(LOCAL_KEY, []) : []));
  const [loading, setLoading] = useState(!isLocalBackend);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setRecurring(readLocal<Recurring[]>(LOCAL_KEY, []));
      setLoading(false);
      return;
    }
    if (!userId) {
      setRecurring([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSupabase()
      .from("recurring")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setRecurring(((data as RecurringRow[]) ?? []).map(fromRecurringRow));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addRecurring = useCallback(
    async (r: NewRecurring) => {
      if (isLocalBackend) {
        setRecurring((prev) => {
          const next = [...prev, { id: crypto.randomUUID(), ...r }];
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      if (!userId) return;
      const { error } = await getSupabase().from("recurring").insert({
        user_id: userId,
        category_id: r.categoryId,
        subcategory: r.subcategory,
        amount: r.amount,
        note: r.note,
        day: r.day,
      });
      if (error) throw error;
      await refetch();
    },
    [userId, refetch],
  );

  const removeRecurring = useCallback(
    async (id: string) => {
      if (isLocalBackend) {
        setRecurring((prev) => {
          const next = prev.filter((r) => r.id !== id);
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("recurring").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const updateRecurringAmount = useCallback(
    async (id: string, amount: number) => {
      if (isLocalBackend) {
        setRecurring((prev) => {
          const next = prev.map((r) => (r.id === id ? { ...r, amount } : r));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("recurring").update({ amount }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  return { recurring, loading, error, addRecurring, removeRecurring, updateRecurringAmount, refetch };
}
