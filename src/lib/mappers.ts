import type {
  AssetRow,
  CategoryRow,
  FundRow,
  InvestmentConfigRow,
  RecurringIncomeRow,
  RecurringRow,
  SubscriptionRow,
  TransactionRow,
  UserSettingsRow,
  VariableBudgetRow,
} from "../types/db";
import type {
  Asset,
  Category,
  Fund,
  InvestmentConfig,
  Recurring,
  RecurringIncome,
  SubscriptionPlan,
  Transaction,
} from "../types";

export function fromTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    date: row.date,
    category: row.category,
    categoryId: row.category_id,
    subcategory: row.subcategory,
    subcategoryId: row.subcategory_id,
    note: row.note,
    fixed: row.fixed,
    fundId: row.fund_id,
    fundedBy: row.funded_by,
    splitId: row.split_id,
    recurringId: row.recurring_id,
    recurringIncomeId: row.recurring_income_id,
  };
}

export function toTransactionInsert(userId: string, tx: Omit<Transaction, "id">) {
  return {
    user_id: userId,
    type: tx.type,
    amount: tx.amount,
    date: tx.date,
    category: tx.category,
    category_id: tx.categoryId ?? null,
    subcategory: tx.subcategory ?? null,
    subcategory_id: tx.subcategoryId ?? null,
    note: tx.note ?? "",
    fixed: tx.fixed ?? null,
    fund_id: tx.fundId ?? null,
    funded_by: tx.fundedBy ?? null,
    split_id: tx.splitId ?? null,
    recurring_id: tx.recurringId ?? null,
    recurring_income_id: tx.recurringIncomeId ?? null,
  };
}

export function toTransactionUpdate(updates: Partial<Transaction>) {
  const row: Record<string, unknown> = {};
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.amount !== undefined) row.amount = updates.amount;
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.categoryId !== undefined) row.category_id = updates.categoryId;
  if (updates.subcategory !== undefined) row.subcategory = updates.subcategory;
  if (updates.subcategoryId !== undefined) row.subcategory_id = updates.subcategoryId;
  if (updates.note !== undefined) row.note = updates.note;
  if (updates.fixed !== undefined) row.fixed = updates.fixed;
  if (updates.fundId !== undefined) row.fund_id = updates.fundId;
  if (updates.fundedBy !== undefined) row.funded_by = updates.fundedBy;
  if (updates.splitId !== undefined) row.split_id = updates.splitId;
  if (updates.recurringId !== undefined) row.recurring_id = updates.recurringId;
  if (updates.recurringIncomeId !== undefined) row.recurring_income_id = updates.recurringIncomeId;
  return row;
}

export function fromFundRow(row: FundRow): Fund {
  return { id: row.id, name: row.name, goalAmount: row.goal_amount };
}

export function fromCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    subcategories: row.subcategories ?? [],
    budget: row.budget,
    sortOrder: row.sort_order,
  };
}

export function fromRecurringRow(row: RecurringRow): Recurring {
  return {
    id: row.id,
    categoryId: row.category_id,
    subcategory: row.subcategory,
    amount: Number(row.amount),
    note: row.note,
    day: row.day,
  };
}

export function fromRecurringIncomeRow(row: RecurringIncomeRow): RecurringIncome {
  return {
    id: row.id,
    incomeCat: row.income_cat,
    name: row.name,
    amount: Number(row.amount),
    note: row.note,
    day: row.day,
  };
}

export function fromAssetRow(row: AssetRow): Asset {
  return { id: row.id, name: row.name, pct: Number(row.pct) };
}

export function fromInvestmentConfigRow(row: InvestmentConfigRow | null): InvestmentConfig {
  return { globalPct: row ? Number(row.global_pct) : 0 };
}

export function fromVariableBudgetRow(row: VariableBudgetRow | null): number {
  return row ? Number(row.amount) : 0;
}

export function fromUserSettingsRow(row: UserSettingsRow | null): boolean {
  return row?.onboarding_completed ?? false;
}

export function fromSavingsMilestoneRow(row: UserSettingsRow | null): boolean {
  return row?.savings_milestone_shown ?? false;
}

// Sin fila -> free. Plan "premium" con status distinto de "active" (cancelled/past_due) también
// se trata como free: si el pago falló o se canceló, no debe seguir dando acceso premium.
export function fromSubscriptionRow(row: SubscriptionRow | null): SubscriptionPlan {
  if (!row) return "free";
  return row.plan === "premium" && row.status === "active" ? "premium" : "free";
}
