import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromAssetRow } from "../lib/mappers";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { AssetRow } from "../types/db";
import type { Asset } from "../types";

const LOCAL_KEY = "assets";

export function useAssets(userId: string | undefined) {
  const [assets, setAssets] = useState<Asset[]>(() => (isLocalBackend ? readLocal<Asset[]>(LOCAL_KEY, []) : []));
  const [loading, setLoading] = useState(!isLocalBackend);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setAssets(readLocal<Asset[]>(LOCAL_KEY, []));
      setLoading(false);
      return;
    }
    if (!userId) {
      setAssets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSupabase()
      .from("assets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setAssets(((data as AssetRow[]) ?? []).map(fromAssetRow));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addAsset = useCallback(
    async (name: string) => {
      if (isLocalBackend) {
        setAssets((prev) => {
          const next = [...prev, { id: crypto.randomUUID(), name, pct: 0 }];
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      if (!userId) return;
      const { error } = await getSupabase().from("assets").insert({ user_id: userId, name, pct: 0 });
      if (error) throw error;
      await refetch();
    },
    [userId, refetch],
  );

  const renameAsset = useCallback(
    async (id: string, name: string) => {
      if (isLocalBackend) {
        setAssets((prev) => {
          const next = prev.map((a) => (a.id === id ? { ...a, name } : a));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("assets").update({ name }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const updateAssetPct = useCallback(
    async (id: string, pct: number) => {
      if (isLocalBackend) {
        setAssets((prev) => {
          const next = prev.map((a) => (a.id === id ? { ...a, pct } : a));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("assets").update({ pct }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const removeAsset = useCallback(
    async (id: string) => {
      if (isLocalBackend) {
        setAssets((prev) => {
          const next = prev.filter((a) => a.id !== id);
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("assets").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  return { assets, loading, error, addAsset, renameAsset, updateAssetPct, removeAsset, refetch };
}
