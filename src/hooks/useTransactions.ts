import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromTransactionRow, toTransactionInsert, toTransactionUpdate } from "../lib/mappers";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { TransactionRow } from "../types/db";
import type { Transaction } from "../types";

const LOCAL_KEY = "transactions";

export type NewTransaction = Omit<Transaction, "id"> & {
  splitFundId?: string | null;
  splitFundAmount?: number;
};

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    isLocalBackend ? readLocal<Transaction[]>(LOCAL_KEY, []) : [],
  );
  const [loading, setLoading] = useState(!isLocalBackend);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setTransactions(readLocal<Transaction[]>(LOCAL_KEY, []));
      setLoading(false);
      return;
    }
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSupabase()
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      // Desempate por created_at: dos movimientos con la misma fecha (p. ej. registrados el mismo día)
      // se ordenaban por lo que devolviera Postgres, sin garantía; con esto el creado más reciente
      // aparece primero dentro del mismo día. Mismo patrón que el desempate en useFunds.
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setTransactions(((data as TransactionRow[]) ?? []).map(fromTransactionRow));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addTransaction = useCallback(
    async (tx: NewTransaction) => {
      if (isLocalBackend) {
        // Actualización funcional: applyPresets y otros flujos llaman a addTransaction varias
        // veces seguidas en el mismo tick, sin esperar a que React vuelva a renderizar. Leer
        // "transactions" del closure aquí haría que cada llamada partiera del mismo estado
        // desactualizado y solo sobreviviera la última (bug ya visto con los preestablecidos).
        setTransactions((prev) => {
          let next: Transaction[];
          if (tx.type === "gasto" && tx.splitFundId) {
            const splitId = crypto.randomUUID();
            const ordinarioAmount = Math.max(0, tx.amount - (tx.splitFundAmount ?? 0));
            const { splitFundId, splitFundAmount, ...base } = tx;
            next = [
              ...prev,
              { id: crypto.randomUUID(), ...base, amount: ordinarioAmount, fundedBy: null, splitId },
              { id: crypto.randomUUID(), ...base, amount: splitFundAmount ?? 0, fundedBy: splitFundId, splitId },
            ];
          } else {
            next = [...prev, { id: crypto.randomUUID(), ...tx }];
          }
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      if (!userId) return;
      if (tx.type === "gasto" && tx.splitFundId) {
        const splitId = crypto.randomUUID();
        const ordinarioAmount = Math.max(0, tx.amount - (tx.splitFundAmount ?? 0));
        const { splitFundId, splitFundAmount, ...base } = tx;
        const rows = [
          toTransactionInsert(userId, { ...base, amount: ordinarioAmount, fundedBy: null, splitId }),
          toTransactionInsert(userId, {
            ...base,
            amount: splitFundAmount ?? 0,
            fundedBy: splitFundId,
            splitId,
          }),
        ];
        const { error } = await getSupabase().from("transactions").insert(rows);
        if (error) throw error;
      } else {
        const { error } = await getSupabase().from("transactions").insert(toTransactionInsert(userId, tx));
        if (error) throw error;
      }
      await refetch();
    },
    [userId, refetch],
  );

  const editTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      if (isLocalBackend) {
        setTransactions((prev) => {
          const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("transactions").update(toTransactionUpdate(updates)).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (isLocalBackend) {
        setTransactions((prev) => {
          const tx = prev.find((t) => t.id === id);
          if (!tx) return prev;
          const next = tx.splitId ? prev.filter((t) => t.splitId !== tx.splitId) : prev.filter((t) => t.id !== id);
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const tx = transactions.find((t) => t.id === id);
      if (!tx) return;
      if (tx.splitId) {
        const { error } = await getSupabase().from("transactions").delete().eq("split_id", tx.splitId);
        if (error) throw error;
      } else {
        const { error } = await getSupabase().from("transactions").delete().eq("id", id);
        if (error) throw error;
      }
      await refetch();
    },
    [transactions, refetch],
  );

  return { transactions, loading, error, addTransaction, editTransaction, deleteTransaction, refetch };
}
