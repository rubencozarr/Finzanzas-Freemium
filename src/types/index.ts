export type TransactionType = "ingreso" | "gasto" | "aportacion" | "retiro" | "inversion";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO "YYYY-MM-DD"
  category: string; // nombre "congelado" en el momento de crear el movimiento (fallback de visualización)
  categoryId?: string | null; // referencia estable a Category.id (solo gastos); fuente de verdad para agrupar
  subcategory: string | null; // nombre "congelado" (fallback de visualización)
  subcategoryId?: string | null; // referencia estable a Subcategory.id dentro de la categoría
  note: string;
  fixed?: boolean | null; // solo gastos: true = fijo, false = variable
  fundId?: string | null; // solo aportacion/retiro
  fundedBy?: string | null; // solo gastos: id de fondo o "ahorro_libre"
  splitId?: string | null; // gastos divididos entre ingreso y fondo
  recurringId?: string | null;
  recurringIncomeId?: string | null;
}

export interface Fund {
  id: string;
  name: string;
  goalAmount?: number | null;
  isActive?: boolean;
  icon?: string | null;
  sortOrder?: number;
  initialBalance?: number;
}

export interface FundWithBalance extends Fund {
  balance: number;
  // Saldo sin el initialBalance: aportado - retirado - usado, exactamente lo que "balance" era antes
  // de que existiera el saldo inicial. Único campo que deben leer los cálculos de flujo que no deben
  // verse afectados por el saldo inicial (ver comentario en fundsWithBalance, calculations.ts).
  flowBalance: number;
  virtualTotalAportado?: number;
}

export interface Subcategory {
  id: string;
  name: string;
}

export type CategoryType = "fixed" | "variable";

export interface Category {
  id: string;
  type: CategoryType;
  name: string;
  subcategories: Subcategory[];
  budget?: number | null; // solo variables
  sortOrder: number;
  isActive?: boolean;
}

export interface Recurring {
  id: string;
  categoryId: string;
  subcategory: string | null;
  amount: number;
  note: string;
  day: number | null;
  fundedByFundId?: string | null;
}

export type IncomeCategory = "Ingreso fijo" | "Ingreso extra";

export interface RecurringIncome {
  id: string;
  incomeCat: IncomeCategory;
  name: string;
  amount: number;
  note: string;
  day: number | null;
}

export interface Asset {
  id: string;
  name: string;
  pct: number;
}

export interface AssetWithTotal extends Asset {
  invertido: number;
}

export interface InvestmentConfig {
  globalPct: number;
}

export type SubscriptionPlan = "free" | "premium";
