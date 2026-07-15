import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromFundRow } from "../lib/mappers";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { FundRow } from "../types/db";
import type { Fund } from "../types";

const LOCAL_KEY = "funds";

export function useFunds(userId: string | undefined) {
  const [funds, setFunds] = useState<Fund[]>(() => (isLocalBackend ? readLocal<Fund[]>(LOCAL_KEY, []) : []));
  const [loading, setLoading] = useState(!isLocalBackend);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setFunds(readLocal<Fund[]>(LOCAL_KEY, []));
      setLoading(false);
      return;
    }
    if (!userId) {
      setFunds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSupabase()
      .from("funds")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setFunds(((data as FundRow[]) ?? []).map(fromFundRow));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Nota: todas las mutaciones en modo local usan la forma funcional de setState (prev => ...)
  // en vez de leer "funds" del closure, para que llamadas seguidas en el mismo tick no se pisen
  // entre sí (mismo bug que en useTransactions con los preestablecidos).
  const addFund = useCallback(
    async (name: string) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const next = [...prev, { id: crypto.randomUUID(), name }];
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      if (!userId) return;
      const { error } = await getSupabase().from("funds").insert({ user_id: userId, name });
      if (error) throw error;
      await refetch();
    },
    [userId, refetch],
  );

  const renameFund = useCallback(
    async (id: string, name: string) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const next = prev.map((f) => (f.id === id ? { ...f, name } : f));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("funds").update({ name }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const deleteFund = useCallback(
    async (id: string) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const next = prev.filter((f) => f.id !== id);
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("funds").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const updateFundGoal = useCallback(
    async (id: string, amount: number | null) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const next = prev.map((f) => (f.id === id ? { ...f, goalAmount: amount } : f));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("funds").update({ goal_amount: amount }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const updateFundActive = useCallback(
    async (id: string, active: boolean) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const next = prev.map((f) => (f.id === id ? { ...f, isActive: active } : f));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("funds").update({ is_active: active }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  return { funds, loading, error, addFund, renameFund, deleteFund, updateFundGoal, updateFundActive, refetch };
}
