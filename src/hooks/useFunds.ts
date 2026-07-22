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
    async (name: string, icon?: string | null, initialBalance?: number) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const nextOrder = prev.length ? Math.max(...prev.map((f) => f.sortOrder ?? 0)) + 1 : 0;
          const next = [
            ...prev,
            { id: crypto.randomUUID(), name, icon: icon ?? null, sortOrder: nextOrder, initialBalance: initialBalance ?? 0 },
          ];
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      if (!userId) return;
      const nextOrder = funds.length ? Math.max(...funds.map((f) => f.sortOrder ?? 0)) + 1 : 0;
      const { error } = await getSupabase()
        .from("funds")
        .insert({ user_id: userId, name, icon: icon ?? null, sort_order: nextOrder, initial_balance: initialBalance ?? 0 });
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
          // Cambiar la meta resetea goal_notified: si ya se había avisado de la meta anterior, hay
          // que poder avisar de nuevo cuando se alcance la nueva.
          const next = prev.map((f) => (f.id === id ? { ...f, goalAmount: amount, goalNotified: false } : f));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase()
        .from("funds")
        .update({ goal_amount: amount, goal_notified: false })
        .eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  // Marca/desmarca si ya se avisó de que este fondo alcanzó su meta. App.tsx la llama al detectar que
  // el saldo cruza goal_amount (true) o vuelve a caer por debajo (false, sin aviso, para poder
  // notificar de nuevo la próxima vez que se alcance).
  const setFundGoalNotified = useCallback(
    async (id: string, notified: boolean) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const next = prev.map((f) => (f.id === id ? { ...f, goalNotified: notified } : f));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("funds").update({ goal_notified: notified }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const updateFundInitialBalance = useCallback(
    async (id: string, amount: number) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const next = prev.map((f) => (f.id === id ? { ...f, initialBalance: amount } : f));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("funds").update({ initial_balance: amount }).eq("id", id);
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

  /** Mueve el fondo una posición arriba/abajo y renumera TODA la lista a valores secuenciales
   * (0..n-1), en vez de solo intercambiar el sort_order de los dos fondos movidos: los fondos ya
   * existentes antes de esta función comparten todos sort_order 0 (columna añadida con default 0),
   * así que un simple intercambio entre dos ceros no cambiaba nada. Renumerar todo garantiza que el
   * primer movimiento (y todos los siguientes) funcionen sin depender de que ya hubiera valores
   * distintos de antes. */
  const updateFundOrder = useCallback(
    async (id: string, direction: -1 | 1) => {
      if (isLocalBackend) {
        setFunds((prev) => {
          const ordered = [...prev].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const idx = ordered.findIndex((f) => f.id === id);
          const swapIdx = idx + direction;
          if (idx === -1 || swapIdx < 0 || swapIdx >= ordered.length) return prev;
          [ordered[idx], ordered[swapIdx]] = [ordered[swapIdx], ordered[idx]];
          const orderById = new Map(ordered.map((f, i) => [f.id, i]));
          const next = prev.map((f) => ({ ...f, sortOrder: orderById.get(f.id) ?? f.sortOrder ?? 0 }));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const ordered = [...funds].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      const idx = ordered.findIndex((f) => f.id === id);
      const swapIdx = idx + direction;
      if (idx === -1 || swapIdx < 0 || swapIdx >= ordered.length) return;
      [ordered[idx], ordered[swapIdx]] = [ordered[swapIdx], ordered[idx]];
      const results = await Promise.all(
        ordered.map((f, i) => getSupabase().from("funds").update({ sort_order: i }).eq("id", f.id)),
      );
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;
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
    setFundGoalNotified,
    updateFundInitialBalance,
    updateFundActive,
    updateFundIcon,
    updateFundOrder,
    refetch,
  };
}
