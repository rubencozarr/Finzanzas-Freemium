import type { Category, CategoryType, TransactionType } from "../types";

export const AHORRO_LIBRE_ID = "ahorro_libre";

// Límites del plan free (ver MASTER-PLAN-FREEMIUM.md, sección 4).
export const FREE_MAX_FUNDS = 2;
export const FREE_MAX_CATEGORIES: Record<CategoryType, number> = { fixed: 6, variable: 6 };
export const FREE_HISTORY_MONTHS = 6;

export const TYPE_META: Record<TransactionType, { color: string; sign: 1 | -1 }> = {
  ingreso: { color: "text-emerald-700", sign: 1 },
  gasto: { color: "text-rose-700", sign: -1 },
  aportacion: { color: "text-teal-700", sign: -1 },
  retiro: { color: "text-amber-700", sign: 1 },
  inversion: { color: "text-indigo-700", sign: -1 },
};

export const INCOME_CATS = ["Ingreso fijo", "Ingreso extra"] as const;

export const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const MONTHS_FULL = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

interface DefaultCategorySeed {
  type: "fixed" | "variable";
  name: string;
  subcategoryNames: string[];
}

const DEFAULT_CATEGORY_SEEDS: DefaultCategorySeed[] = [
  { type: "fixed", name: "Vivienda", subcategoryNames: [] },
  { type: "fixed", name: "Suministros", subcategoryNames: [] },
  { type: "fixed", name: "Seguros", subcategoryNames: [] },
  { type: "fixed", name: "Préstamos", subcategoryNames: [] },
  { type: "fixed", name: "Suscripciones", subcategoryNames: [] },
  { type: "fixed", name: "Educación", subcategoryNames: [] },
  { type: "variable", name: "Alimentación", subcategoryNames: [] },
  { type: "variable", name: "Transporte", subcategoryNames: [] },
  { type: "variable", name: "Ocio", subcategoryNames: [] },
  { type: "variable", name: "Salud", subcategoryNames: [] },
  { type: "variable", name: "Ropa", subcategoryNames: [] },
  { type: "variable", name: "Otros", subcategoryNames: [] },
];

/** Categorías por defecto en el modelo de la app (camelCase), para sembrar el modo local. */
export function buildDefaultCategories(): Category[] {
  return DEFAULT_CATEGORY_SEEDS.map((seed, index) => ({
    id: crypto.randomUUID(),
    type: seed.type,
    name: seed.name,
    subcategories: seed.subcategoryNames.map((name) => ({ id: crypto.randomUUID(), name })),
    budget: null,
    sortOrder: index,
  }));
}

/** Filas listas para insertar en la tabla "categories" al crear la cuenta de un usuario nuevo. */
export function buildDefaultCategoryRows(userId: string) {
  return buildDefaultCategories().map((c) => ({
    user_id: userId,
    type: c.type,
    name: c.name,
    subcategories: c.subcategories,
    budget: c.budget,
    sort_order: c.sortOrder,
  }));
}
