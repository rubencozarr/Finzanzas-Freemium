import { isLocalBackend } from "./env";
import { writeLocal } from "./localStore";
import { getSupabase } from "./supabaseClient";
import { todayISO } from "./format";
import { AHORRO_LIBRE_ID } from "./constants";
import type { Asset, Category, Fund, InvestmentConfig, Recurring, RecurringIncome, Transaction } from "../types";

export interface BackupData {
  version: number;
  exportedAt: string;
  transactions: Transaction[];
  funds: Fund[];
  categories: Category[];
  recurring: Recurring[];
  recurringIncome: RecurringIncome[];
  assets: Asset[];
  investmentConfig: InvestmentConfig;
  variableBudget: number;
}

export function buildBackup(data: Omit<BackupData, "version" | "exportedAt">): BackupData {
  return { version: 1, exportedAt: new Date().toISOString(), ...data };
}

export function downloadBackup(data: BackupData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mis-cuentas-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isPlainObject(data: unknown): data is Record<string, unknown> {
  return !!data && typeof data === "object";
}

async function run(promise: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await promise;
  if (error) throw new Error(error.message);
}

async function importToSupabase(userId: string, raw: Partial<BackupData>) {
  const supabase = getSupabase();

  // Borrar todo lo existente del usuario (hijos antes que padres)
  await run(supabase.from("transactions").delete().eq("user_id", userId));
  await run(supabase.from("recurring").delete().eq("user_id", userId));
  await run(supabase.from("recurring_income").delete().eq("user_id", userId));
  await run(supabase.from("assets").delete().eq("user_id", userId));
  await run(supabase.from("funds").delete().eq("user_id", userId));
  await run(supabase.from("categories").delete().eq("user_id", userId));
  await run(supabase.from("investment_config").delete().eq("user_id", userId));
  await run(supabase.from("variable_budget").delete().eq("user_id", userId));

  // Generar ids nuevos para todo lo que tiene clave primaria propia, en vez de reutilizar los del
  // backup: esas claves son globales (no van acompañadas de user_id en la tabla), así que si el backup
  // viene de OTRA cuenta que sigue existiendo en la base de datos (p. ej. importar el export de una
  // cuenta premium en una cuenta free), reutilizar esos mismos ids choca con las filas originales
  // ("duplicate key value violates unique constraint"). Se recuerda el mapeo id-antiguo -> id-nuevo
  // para reescribir las referencias cruzadas (categoryId, fundId, recurringId, recurringIncomeId).
  // subcategory_id no se remapea: las subcategorías viven en el jsonb de la categoría (sin FK real,
  // ver comentario en schema.sql) y ese jsonb se copia tal cual, así que sus ids internos no cambian.
  const categoryIdMap = new Map<string, string>();
  const fundIdMap = new Map<string, string>();
  const recurringIdMap = new Map<string, string>();
  const recurringIncomeIdMap = new Map<string, string>();

  if (raw.categories?.length) {
    await run(
      supabase.from("categories").insert(
        raw.categories.map((c) => {
          const id = crypto.randomUUID();
          categoryIdMap.set(c.id, id);
          return {
            id,
            user_id: userId,
            type: c.type,
            name: c.name,
            subcategories: c.subcategories,
            budget: c.budget ?? null,
            sort_order: c.sortOrder,
            is_active: c.isActive ?? true,
          };
        }),
      ),
    );
  }
  if (raw.funds?.length) {
    await run(
      supabase.from("funds").insert(
        raw.funds.map((f) => {
          const id = crypto.randomUUID();
          fundIdMap.set(f.id, id);
          return {
            id,
            user_id: userId,
            name: f.name,
            goal_amount: f.goalAmount ?? null,
            is_active: f.isActive ?? true,
            icon: f.icon ?? null,
            sort_order: f.sortOrder ?? 0,
          };
        }),
      ),
    );
  }
  if (raw.recurring?.length) {
    await run(
      supabase.from("recurring").insert(
        raw.recurring.map((r) => {
          const id = crypto.randomUUID();
          recurringIdMap.set(r.id, id);
          return {
            id,
            user_id: userId,
            category_id: categoryIdMap.get(r.categoryId) ?? r.categoryId,
            subcategory: r.subcategory,
            amount: r.amount,
            note: r.note,
            day: r.day,
          };
        }),
      ),
    );
  }
  if (raw.recurringIncome?.length) {
    await run(
      supabase.from("recurring_income").insert(
        raw.recurringIncome.map((r) => {
          const id = crypto.randomUUID();
          recurringIncomeIdMap.set(r.id, id);
          return {
            id,
            user_id: userId,
            income_cat: r.incomeCat,
            name: r.name,
            amount: r.amount,
            note: r.note,
            day: r.day,
          };
        }),
      ),
    );
  }
  if (raw.assets?.length) {
    await run(
      supabase.from("assets").insert(raw.assets.map((a) => ({ id: crypto.randomUUID(), user_id: userId, name: a.name, pct: a.pct }))),
    );
  }
  if (raw.investmentConfig) {
    await run(supabase.from("investment_config").insert({ user_id: userId, global_pct: raw.investmentConfig.globalPct }));
  }
  if (raw.variableBudget != null) {
    await run(supabase.from("variable_budget").insert({ user_id: userId, amount: raw.variableBudget }));
  }
  if (raw.transactions?.length) {
    await run(
      supabase.from("transactions").insert(
        raw.transactions.map((t) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          type: t.type,
          amount: t.amount,
          date: t.date,
          category: t.category,
          category_id: t.categoryId ? (categoryIdMap.get(t.categoryId) ?? null) : null,
          subcategory: t.subcategory ?? null,
          subcategory_id: t.subcategoryId ?? null,
          note: t.note ?? "",
          fixed: t.fixed ?? null,
          fund_id: t.fundId ? (fundIdMap.get(t.fundId) ?? null) : null,
          funded_by: t.fundedBy ? (t.fundedBy === AHORRO_LIBRE_ID ? t.fundedBy : (fundIdMap.get(t.fundedBy) ?? null)) : null,
          split_id: t.splitId ?? null,
          recurring_id: t.recurringId ? (recurringIdMap.get(t.recurringId) ?? null) : null,
          recurring_income_id: t.recurringIncomeId ? (recurringIncomeIdMap.get(t.recurringIncomeId) ?? null) : null,
        })),
      ),
    );
  }
}

/** Reemplaza TODOS los datos del usuario por los del backup. No se puede deshacer. */
export async function importBackup(userId: string | undefined, data: unknown): Promise<boolean> {
  if (!isPlainObject(data)) return false;
  const raw = data as Partial<BackupData>;

  if (isLocalBackend) {
    if (Array.isArray(raw.transactions)) writeLocal("transactions", raw.transactions);
    if (Array.isArray(raw.funds)) writeLocal("funds", raw.funds);
    if (Array.isArray(raw.categories)) writeLocal("categories", raw.categories);
    if (Array.isArray(raw.recurring)) writeLocal("recurring", raw.recurring);
    if (Array.isArray(raw.recurringIncome)) writeLocal("recurringIncome", raw.recurringIncome);
    if (Array.isArray(raw.assets)) writeLocal("assets", raw.assets);
    if (raw.investmentConfig) writeLocal("investmentConfig", raw.investmentConfig);
    if (raw.variableBudget != null) writeLocal("variableBudget", raw.variableBudget);
    return true;
  }

  if (!userId) return false;
  await importToSupabase(userId, raw);
  return true;
}
