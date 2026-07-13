-- Esquema de base de datos para "Mis cuentas"
-- Pegar en el SQL Editor de Supabase (Project > SQL Editor > New query) y ejecutar.
-- Fuente de verdad del modelo de datos: docs/ESPECIFICACION-APP-FINANZAS.md

-- gen_random_uuid() viene de la extensión pgcrypto, ya habilitada por defecto en proyectos Supabase.

-- =========================================================
-- FUNDS (fondos de ahorro)
-- REGLA CRÍTICA: el saldo nunca se guarda, siempre se deriva de transactions.
-- =========================================================
create table if not exists public.funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- CATEGORIES (categorías de gasto)
-- subcategories como jsonb: [{ "id": "...", "name": "..." }, ...]
-- =========================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('fixed', 'variable')),
  name text not null,
  subcategories jsonb not null default '[]'::jsonb,
  budget numeric(12, 2),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================
-- RECURRING (gastos fijos preestablecidos)
-- =========================================================
create table if not exists public.recurring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  subcategory text,
  amount numeric(12, 2) not null check (amount > 0),
  note text not null default '',
  day smallint check (day between 1 and 31),
  created_at timestamptz not null default now()
);

-- =========================================================
-- RECURRING_INCOME (ingresos recurrentes)
-- =========================================================
create table if not exists public.recurring_income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  income_cat text not null check (income_cat in ('Ingreso fijo', 'Ingreso extra')),
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  note text not null default '',
  day smallint check (day between 1 and 31),
  created_at timestamptz not null default now()
);

-- =========================================================
-- ASSETS (activos de inversión)
-- REGLA: el total invertido nunca se guarda, se deriva de transactions.
-- =========================================================
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  pct numeric(5, 2) not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================
-- INVESTMENT_CONFIG (una fila por usuario)
-- =========================================================
create table if not exists public.investment_config (
  user_id uuid primary key references auth.users (id) on delete cascade,
  global_pct numeric(5, 2) not null default 0,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- VARIABLE_BUDGET (una fila por usuario)
-- =========================================================
create table if not exists public.variable_budget (
  user_id uuid primary key references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- USER_SETTINGS (una fila por usuario)
-- Ajustes de la app en sí (no datos financieros), como si ya vio el tutorial guiado.
-- Vive en Supabase (no en localStorage) para que sea el mismo estado en cualquier dispositivo.
-- =========================================================
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  onboarding_completed boolean not null default false,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- SUBSCRIPTIONS (estado de suscripción freemium, una fila por usuario)
-- REGLA: si un usuario no tiene fila aquí, se considera 'free'. No se crea
-- fila automáticamente al registrarse; el hook useSubscription trata la
-- ausencia de fila como plan free.
-- =========================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'past_due')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- TRANSACTIONS (movimientos)
-- Depende de funds, recurring y recurring_income: se crea al final.
-- =========================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('ingreso', 'gasto', 'aportacion', 'retiro', 'inversion')),
  amount numeric(12, 2) not null check (amount > 0),
  date date not null,
  category text not null,
  -- Referencia estable a categories.id (solo gastos). Es la fuente de verdad para agrupar
  -- por categoría: renombrar una categoría no requiere tocar los movimientos, porque el id
  -- nunca cambia. "category" (el texto) se conserva como snapshot/fallback de visualización.
  category_id uuid references public.categories (id) on delete set null,
  subcategory text,
  -- Las subcategorías viven dentro del jsonb "categories.subcategories", no en su propia tabla,
  -- así que este campo no puede llevar una FK real; se valida en la aplicación.
  subcategory_id uuid,
  note text not null default '',
  fixed boolean,
  fund_id uuid references public.funds (id) on delete set null,
  funded_by text,
  split_id uuid,
  recurring_id uuid references public.recurring (id) on delete set null,
  recurring_income_id uuid references public.recurring_income (id) on delete set null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ÍNDICES
-- =========================================================
create index if not exists idx_transactions_user_date on public.transactions (user_id, date desc);
create index if not exists idx_transactions_user_type on public.transactions (user_id, type);
create index if not exists idx_transactions_split_id on public.transactions (split_id) where split_id is not null;
create index if not exists idx_transactions_fund_id on public.transactions (fund_id) where fund_id is not null;
create index if not exists idx_transactions_category_id on public.transactions (category_id) where category_id is not null;
create index if not exists idx_funds_user on public.funds (user_id);
create index if not exists idx_categories_user on public.categories (user_id, sort_order);
create index if not exists idx_recurring_user on public.recurring (user_id);
create index if not exists idx_recurring_income_user on public.recurring_income (user_id);
create index if not exists idx_assets_user on public.assets (user_id);

-- =========================================================
-- ROW LEVEL SECURITY
-- Cada usuario solo puede ver/crear/editar/borrar sus propias filas.
-- =========================================================
alter table public.transactions enable row level security;
alter table public.funds enable row level security;
alter table public.categories enable row level security;
alter table public.recurring enable row level security;
alter table public.recurring_income enable row level security;
alter table public.assets enable row level security;
alter table public.investment_config enable row level security;
alter table public.variable_budget enable row level security;
alter table public.user_settings enable row level security;
alter table public.subscriptions enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['transactions', 'funds', 'categories', 'recurring', 'recurring_income', 'assets', 'investment_config', 'variable_budget', 'user_settings', 'subscriptions']
  loop
    execute format('drop policy if exists "select_own" on public.%I', t);
    execute format('drop policy if exists "insert_own" on public.%I', t);
    execute format('drop policy if exists "update_own" on public.%I', t);
    execute format('drop policy if exists "delete_own" on public.%I', t);

    execute format('create policy "select_own" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "insert_own" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "update_own" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "delete_own" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- =========================================================
-- Nota sobre categorías por defecto:
-- No hay trigger de creación automática. La app debe comprobar, en el primer
-- login de cada usuario, si "categories" está vacío y en tal caso insertar
-- las categorías por defecto descritas en la especificación
-- (ver src/lib/constants.ts > DEFAULT_CATEGORIES una vez migrado).
-- =========================================================

-- =========================================================
-- Marcar la cuenta del desarrollador como premium.
-- Sustituye TU_USER_ID por tu auth.users.id (Authentication > Users en el
-- dashboard de Supabase) y ejecuta una sola vez.
-- =========================================================
insert into public.subscriptions (user_id, plan, status)
values ('93847357-cff2-4684-9081-2b2c0fba2c09', 'premium', 'active')
on conflict (user_id) do update set plan = excluded.plan, status = excluded.status, updated_at = now();
