import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromIncomeSourceRow } from "../lib/mappers";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { IncomeSourceRow } from "../types/db";
import type { IncomeSource } from "../types";

const LOCAL_KEY = "incomeSources";

export function useIncomeSources(userId: string | undefined) {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(() =>
    isLocalBackend ? readLocal<IncomeSource[]>(LOCAL_KEY, []) : [],
  );
  const [loading, setLoading] = useState(!isLocalBackend);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setIncomeSources(readLocal<IncomeSource[]>(LOCAL_KEY, []));
      setLoading(false);
      return;
    }
    if (!userId) {
      setIncomeSources([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSupabase()
      .from("income_sources")
      .select("*")
      .eq("user_id", userId)
      // Mismo desempate que useFunds.ts: sort_order manda, created_at/id solo para fuentes creadas en
      // bloque (misma transacción) que comparten sort_order 0, evitando que la lista "salte" de orden.
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (error) setError(error.message);
    else setIncomeSources(((data as IncomeSourceRow[]) ?? []).map(fromIncomeSourceRow));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Devuelve la fuente creada (con su id ya asignado): a diferencia de otros hooks de este archivo
  // (useFunds, useCategories), aquí el resultado hace falta de inmediato para seleccionar la fuente
  // recién creada en el mismo formulario desde el que se creó ("+ Nueva fuente" en NuevoMovimientoForm),
  // sin esperar al refetch asíncrono.
  const addIncomeSource = useCallback(
    async (name: string): Promise<IncomeSource> => {
      if (isLocalBackend) {
        const created: IncomeSource = { id: crypto.randomUUID(), name, sortOrder: 0 };
        setIncomeSources((prev) => {
          const nextOrder = prev.length ? Math.max(...prev.map((s) => s.sortOrder)) + 1 : 0;
          created.sortOrder = nextOrder;
          const next = [...prev, created];
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return created;
      }
      if (!userId) throw new Error("No hay sesión");
      const nextOrder = incomeSources.length ? Math.max(...incomeSources.map((s) => s.sortOrder)) + 1 : 0;
      const { data, error } = await getSupabase()
        .from("income_sources")
        .insert({ user_id: userId, name, sort_order: nextOrder })
        .select("*")
        .single();
      if (error) throw error;
      await refetch();
      return fromIncomeSourceRow(data as IncomeSourceRow);
    },
    [userId, incomeSources, refetch],
  );

  const renameIncomeSource = useCallback(
    async (id: string, name: string) => {
      if (isLocalBackend) {
        setIncomeSources((prev) => {
          const next = prev.map((s) => (s.id === id ? { ...s, name } : s));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("income_sources").update({ name }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  // Antes de borrar, se actualiza income_source_name en todos los movimientos de esta fuente con su
  // nombre ACTUAL (no el de cuando se creó cada movimiento): así el histórico muestra el nombre vigente
  // en el momento del borrado, no uno antiguo si la fuente se había renombrado entre medias. A partir de
  // aquí esos movimientos se agrupan por ese nombre guardado (ver resolveIncomeSourceName/
  // buildIncomeBySource en calculations.ts), igual que ya hacen fondos/categorías eliminados.
  const removeIncomeSource = useCallback(
    async (id: string, name: string) => {
      if (isLocalBackend) {
        const txs = readLocal<{ type: string; incomeSourceId?: string | null; incomeSourceName?: string | null }[]>(
          "transactions",
          [],
        );
        const nextTx = txs.map((t) => (t.type === "ingreso" && t.incomeSourceId === id ? { ...t, incomeSourceName: name } : t));
        writeLocal("transactions", nextTx);
        setIncomeSources((prev) => {
          const next = prev.filter((s) => s.id !== id);
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error: snapshotError } = await getSupabase()
        .from("transactions")
        .update({ income_source_name: name })
        .eq("income_source_id", id);
      if (snapshotError) throw snapshotError;
      const { error } = await getSupabase().from("income_sources").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  /** Mueve la fuente una posición arriba/abajo y renumera toda la lista (0..n-1) — mismo patrón que
   * useFunds.updateFundOrder, ver comentario ahí sobre por qué renumerar todo en vez de intercambiar
   * solo dos valores. */
  const updateIncomeSourceOrder = useCallback(
    async (id: string, direction: -1 | 1) => {
      if (isLocalBackend) {
        setIncomeSources((prev) => {
          const ordered = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
          const idx = ordered.findIndex((s) => s.id === id);
          const swapIdx = idx + direction;
          if (idx === -1 || swapIdx < 0 || swapIdx >= ordered.length) return prev;
          [ordered[idx], ordered[swapIdx]] = [ordered[swapIdx], ordered[idx]];
          const orderById = new Map(ordered.map((s, i) => [s.id, i]));
          const next = prev.map((s) => ({ ...s, sortOrder: orderById.get(s.id) ?? s.sortOrder }));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const ordered = [...incomeSources].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = ordered.findIndex((s) => s.id === id);
      const swapIdx = idx + direction;
      if (idx === -1 || swapIdx < 0 || swapIdx >= ordered.length) return;
      [ordered[idx], ordered[swapIdx]] = [ordered[swapIdx], ordered[idx]];
      const results = await Promise.all(
        ordered.map((s, i) => getSupabase().from("income_sources").update({ sort_order: i }).eq("id", s.id)),
      );
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;
      await refetch();
    },
    [incomeSources, refetch],
  );

  return {
    incomeSources,
    loading,
    error,
    addIncomeSource,
    renameIncomeSource,
    removeIncomeSource,
    updateIncomeSourceOrder,
    refetch,
  };
}
