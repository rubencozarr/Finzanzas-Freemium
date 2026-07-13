import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromInvestmentConfigRow } from "../lib/mappers";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { InvestmentConfigRow } from "../types/db";
import type { InvestmentConfig } from "../types";

const LOCAL_KEY = "investmentConfig";

export function useInvestmentConfig(userId: string | undefined) {
  const [investmentConfig, setInvestmentConfig] = useState<InvestmentConfig>(() =>
    isLocalBackend ? readLocal<InvestmentConfig>(LOCAL_KEY, { globalPct: 0 }) : { globalPct: 0 },
  );
  const [loading, setLoading] = useState(!isLocalBackend);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setInvestmentConfig(readLocal<InvestmentConfig>(LOCAL_KEY, { globalPct: 0 }));
      setLoading(false);
      return;
    }
    if (!userId) {
      setInvestmentConfig({ globalPct: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSupabase().from("investment_config").select("*").eq("user_id", userId).maybeSingle();
    if (error) setError(error.message);
    else setInvestmentConfig(fromInvestmentConfigRow(data as InvestmentConfigRow | null));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const setGlobalPct = useCallback(
    async (globalPct: number) => {
      if (isLocalBackend) {
        const next = { globalPct };
        setInvestmentConfig(next);
        writeLocal(LOCAL_KEY, next);
        return;
      }
      if (!userId) return;
      const { error } = await getSupabase()
        .from("investment_config")
        .upsert({ user_id: userId, global_pct: globalPct, updated_at: new Date().toISOString() });
      if (error) throw error;
      await refetch();
    },
    [userId, refetch],
  );

  return { investmentConfig, loading, error, setGlobalPct, refetch };
}
