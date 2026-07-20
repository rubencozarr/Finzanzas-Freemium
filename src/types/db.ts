// Formas de fila tal y como las devuelve Supabase (snake_case), reflejando supabase/schema.sql.
// No se usan fuera de src/lib/mappers.ts y los hooks.

import type { CategoryType, IncomeCategory, TransactionType } from "./index";

export interface TransactionRow {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  date: string;
  category: string;
  category_id: string | null;
  subcategory: string | null;
  subcategory_id: string | null;
  note: string;
  fixed: boolean | null;
  fund_id: string | null;
  funded_by: string | null;
  split_id: string | null;
  recurring_id: string | null;
  recurring_income_id: string | null;
  created_at: string;
}

export interface FundRow {
  id: string;
  user_id: string;
  name: string;
  goal_amount: number | null;
  is_active: boolean;
  icon: string | null;
  sort_order: number;
  initial_balance: number;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string;
  type: CategoryType;
  name: string;
  subcategories: { id: string; name: string }[];
  budget: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface RecurringRow {
  id: string;
  user_id: string;
  category_id: string;
  subcategory: string | null;
  amount: number;
  note: string;
  day: number | null;
  funded_by_fund_id: string | null;
  created_at: string;
}

export interface RecurringIncomeRow {
  id: string;
  user_id: string;
  income_cat: IncomeCategory;
  name: string;
  amount: number;
  note: string;
  day: number | null;
  created_at: string;
}

export interface AssetRow {
  id: string;
  user_id: string;
  name: string;
  pct: number;
  created_at: string;
}

export interface InvestmentConfigRow {
  user_id: string;
  global_pct: number;
  updated_at: string;
}

export interface VariableBudgetRow {
  user_id: string;
  amount: number;
  updated_at: string;
}

export interface UserSettingsRow {
  user_id: string;
  onboarding_completed: boolean;
  savings_milestone_shown: boolean;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: "free" | "premium";
  status: "active" | "cancelled" | "past_due";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  lemonsqueezy_subscription_id: string | null;
  lemonsqueezy_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}
