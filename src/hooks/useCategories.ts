import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { fromCategoryRow } from "../lib/mappers";
import { buildDefaultCategories, buildDefaultCategoryRows } from "../lib/constants";
import { isLocalBackend } from "../lib/env";
import { readLocal, writeLocal } from "../lib/localStore";
import type { CategoryRow } from "../types/db";
import type { Category, CategoryType } from "../types";

const LOCAL_KEY = "categories";

function readLocalCategoriesSeeded(): Category[] {
  const existing = readLocal<Category[]>(LOCAL_KEY, []);
  if (existing.length > 0) return existing;
  const seeded = buildDefaultCategories();
  writeLocal(LOCAL_KEY, seeded);
  return seeded;
}

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>(() => (isLocalBackend ? readLocalCategoriesSeeded() : []));
  const [loading, setLoading] = useState(!isLocalBackend);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (isLocalBackend) {
      setCategories(readLocalCategoriesSeeded());
      setLoading(false);
      return;
    }
    if (!userId) {
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSupabase()
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    let rows = (data as CategoryRow[]) ?? [];
    if (rows.length === 0) {
      const { data: seeded, error: seedError } = await getSupabase()
        .from("categories")
        .insert(buildDefaultCategoryRows(userId))
        .select("*");
      if (seedError) {
        setError(seedError.message);
        setLoading(false);
        return;
      }
      rows = ((seeded as CategoryRow[]) ?? []).sort((a, b) => a.sort_order - b.sort_order);
    }
    setCategories(rows.map(fromCategoryRow));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Nota: todas las mutaciones en modo local usan la forma funcional de setState (prev => ...),
  // para que llamadas seguidas en el mismo tick no se pisen entre sí (mismo bug que en
  // useTransactions con los preestablecidos).
  const addCategory = useCallback(
    async (type: CategoryType, name: string) => {
      if (isLocalBackend) {
        setCategories((prev) => {
          const nextOrder = prev.length ? Math.max(...prev.map((c) => c.sortOrder)) + 1 : 0;
          const next = [...prev, { id: crypto.randomUUID(), type, name, subcategories: [], budget: null, sortOrder: nextOrder }];
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      if (!userId) return;
      const nextOrder = categories.length ? Math.max(...categories.map((c) => c.sortOrder)) + 1 : 0;
      const { error } = await getSupabase()
        .from("categories")
        .insert({ user_id: userId, type, name, subcategories: [], sort_order: nextOrder });
      if (error) throw error;
      await refetch();
    },
    [userId, categories, refetch],
  );

  const renameCategory = useCallback(
    async (id: string, name: string) => {
      if (isLocalBackend) {
        setCategories((prev) => {
          const next = prev.map((c) => (c.id === id ? { ...c, name } : c));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("categories").update({ name }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const removeCategory = useCallback(
    async (id: string) => {
      if (isLocalBackend) {
        setCategories((prev) => {
          const next = prev.filter((c) => c.id !== id);
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("categories").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const updateBudget = useCallback(
    async (id: string, budget: number) => {
      if (isLocalBackend) {
        setCategories((prev) => {
          const next = prev.map((c) => (c.id === id ? { ...c, budget } : c));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("categories").update({ budget }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const addSubcategory = useCallback(
    async (categoryId: string, name: string) => {
      if (isLocalBackend) {
        setCategories((prev) => {
          const next = prev.map((c) =>
            c.id === categoryId ? { ...c, subcategories: [...c.subcategories, { id: crypto.randomUUID(), name }] } : c,
          );
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return;
      const subcategories = [...cat.subcategories, { id: crypto.randomUUID(), name }];
      const { error } = await getSupabase().from("categories").update({ subcategories }).eq("id", categoryId);
      if (error) throw error;
      await refetch();
    },
    [categories, refetch],
  );

  const removeSubcategory = useCallback(
    async (categoryId: string, subcategoryId: string) => {
      if (isLocalBackend) {
        setCategories((prev) => {
          const next = prev.map((c) =>
            c.id === categoryId ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subcategoryId) } : c,
          );
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return;
      const subcategories = cat.subcategories.filter((s) => s.id !== subcategoryId);
      const { error } = await getSupabase().from("categories").update({ subcategories }).eq("id", categoryId);
      if (error) throw error;
      await refetch();
    },
    [categories, refetch],
  );

  /** Intercambia el sort_order con la categoría anterior/siguiente del mismo tipo. */
  const moveCategory = useCallback(
    async (id: string, direction: -1 | 1) => {
      if (isLocalBackend) {
        setCategories((prev) => {
          const ordered = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
          const idx = ordered.findIndex((c) => c.id === id);
          if (idx === -1) return prev;
          const type = ordered[idx].type;
          let swapIdx = -1;
          if (direction === -1) {
            for (let j = idx - 1; j >= 0; j--) {
              if (ordered[j].type === type) {
                swapIdx = j;
                break;
              }
            }
          } else {
            for (let j = idx + 1; j < ordered.length; j++) {
              if (ordered[j].type === type) {
                swapIdx = j;
                break;
              }
            }
          }
          if (swapIdx === -1) return prev;
          const a = ordered[idx];
          const b = ordered[swapIdx];
          const next = prev.map((c) => {
            if (c.id === a.id) return { ...c, sortOrder: b.sortOrder };
            if (c.id === b.id) return { ...c, sortOrder: a.sortOrder };
            return c;
          });
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = ordered.findIndex((c) => c.id === id);
      if (idx === -1) return;
      const type = ordered[idx].type;
      let swapIdx = -1;
      if (direction === -1) {
        for (let j = idx - 1; j >= 0; j--) {
          if (ordered[j].type === type) {
            swapIdx = j;
            break;
          }
        }
      } else {
        for (let j = idx + 1; j < ordered.length; j++) {
          if (ordered[j].type === type) {
            swapIdx = j;
            break;
          }
        }
      }
      if (swapIdx === -1) return;
      const a = ordered[idx];
      const b = ordered[swapIdx];
      const { error: e1 } = await getSupabase().from("categories").update({ sort_order: b.sortOrder }).eq("id", a.id);
      const { error: e2 } = await getSupabase().from("categories").update({ sort_order: a.sortOrder }).eq("id", b.id);
      if (e1 || e2) throw e1 || e2;
      await refetch();
    },
    [categories, refetch],
  );

  const updateCategoryActive = useCallback(
    async (id: string, active: boolean) => {
      if (isLocalBackend) {
        setCategories((prev) => {
          const next = prev.map((c) => (c.id === id ? { ...c, isActive: active } : c));
          writeLocal(LOCAL_KEY, next);
          return next;
        });
        return;
      }
      const { error } = await getSupabase().from("categories").update({ is_active: active }).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  return {
    categories,
    loading,
    error,
    addCategory,
    renameCategory,
    removeCategory,
    updateBudget,
    addSubcategory,
    removeSubcategory,
    moveCategory,
    updateCategoryActive,
    refetch,
  };
}
