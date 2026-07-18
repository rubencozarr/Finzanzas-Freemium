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
      // sort_order manda (reordenamiento manual del usuario); created_at y luego id son solo
      // desempate para fondos que nunca se han reordenado (todos con sort_order 0, p. ej. tras la
      // migración o una importación en bloque), donde sin un segundo criterio Postgres puede
      // devolverlos en un orden distinto cada vez que uno de ellos se actualiza (p. ej. al marcarlo
      // como activo), dando la sensación de que la lista "salta" de posición.
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
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
    async (name: string, icon?: string | null) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const nextOrder = prev.length ? Math.max(...prev.map((f) => f.sortOrder ?? 0)) + 1 : 0;
          const next = [...prev, { id: crypto.randomUUID(), name, icon: icon ?? null, sortOrder: nextOrder }];
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      if (!userId) return;
      const nextOrder = funds.length ? Math.max(...funds.map((f) => f.sortOrder ?? 0)) + 1 : 0;
      const { error } = await getSupabase().from("funds").insert({ user_id: userId, name, icon: icon ?? null, sort_order: nextOrder });
      if (error) throw error;
      await refetch();
    },
    [userId, funds, refetch],
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

  const updateFundIcon = useCallback(
    async (id: string, icon: string) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const next = prev.map((f) => (f.id === id ? { ...f, icon } : f));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("funds").update({ icon }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  /** Intercambia el sort_order con el fondo anterior/siguiente. Mismo patrón que moveCategory en
   * useCategories.ts, pero sin agrupar por tipo: los fondos no tienen esa subdivisión. */
  const updateFundOrder = useCallback(
    async (id: string, direction: -1 | 1) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const ordered = [...prev].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const idx = ordered.findIndex((f) => f.id === id);
          const swapIdx = idx + direction;
          if (idx === -1 || swapIdx < 0 || swapIdx >= ordered.length) return prev;
          const a = ordered[idx];
          const b = ordered[swapIdx];
          const next = prev.map((f) => {
            if (f.id === a.id) return { ...f, sortOrder: b.sortOrder ?? 0 };
            if (f.id === b.id) return { ...f, sortOrder: a.sortOrder ?? 0 };
            return f;
          });
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const ordered = [...funds].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      const idx = ordered.findIndex((f) => f.id === id);
      const swapIdx = idx + direction;
      if (idx === -1 || swapIdx < 0 || swapIdx >= ordered.length) return;
      const a = ordered[idx];
      const b = ordered[swapIdx];
      const { error: e1 } = await getSupabase().from("funds").update({ sort_order: b.sortOrder ?? 0 }).eq("id", a.id);
      const { error: e2 } = await getSupabase().from("funds").update({ sort_order: a.sortOrder ?? 0 }).eq("id", b.id);
      if (e1 || e2) throw e1 || e2;
      await refetch();
    },
    [funds, refetch],
  );

  return {
    funds,
    loading,
    error,
    addFund,
    renameFund,
    deleteFund,
    updateFundGoal,
    updateFundActive,
    updateFundIcon,
    updateFundOrder,
    refetch,
  };
}
