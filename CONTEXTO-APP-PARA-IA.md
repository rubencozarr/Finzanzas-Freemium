# Finanzas Freemium ("Nitid") — Documento de contexto para revisión con IA

Este documento está pensado para entregarse a otra IA como contexto completo antes de un análisis
profundo (revisión de arquitectura, auditoría de bugs, propuestas de optimización, etc.). Reúne la
estructura del código, el modelo de datos, la lógica de negocio, el sistema freemium y el historial de
decisiones/errores relevantes que no son evidentes solo leyendo el código.

Repo: `https://github.com/rubencozarr/Finzanzas-Freemium.git` (rama `main`).
Producción: `https://finzanzas-freemium-xi.vercel.app/` (Vercel, deploy automático en cada push a `main`).
Supabase: proyecto `tdmfqrxkeindubkwoijs.supabase.co`.

---

## 1. Qué es la app

Una PWA de finanzas personales ("Nitid") con un modelo freemium añadido posteriormente sobre una
base ya funcional. Permite registrar ingresos/gastos, ahorrar en "fondos" con objetivo, invertir un %
de los ingresos, ver desgloses mensuales/anuales, y tiene un sistema de categorías configurable con
presupuestos. La versión free tiene límites de uso (no de datos): puede importar/tener datos ilimitados,
pero la creación de nuevos elementos y algunas vistas están limitadas o bloqueadas.

## 2. Stack técnico

- **Frontend**: React 19 + TypeScript + Vite 8, sin router (una sola vista con pestañas controladas por
  estado en `App.tsx`), sin librería de estado global (todo vía hooks + props drilling).
- **Estilos**: Tailwind CSS v4 (arquitectura de plugin PostCSS, sin `tailwind.config.js` clásico).
- **Gráficos**: Recharts.
- **Iconos**: lucide-react.
- **Backend**: Supabase (Postgres + Auth + RLS). También existe un **modo local** (`VITE_DATA_BACKEND`)
  que usa `localStorage` con un usuario mock, sin login — pensado para desarrollo/demo sin Supabase.
  Todos los hooks de `src/hooks/` implementan ambos backends detrás de la misma API pública.
- **PWA**: `vite-plugin-pwa` (manifest + service worker, `generateSW`). Iconos de la PWA son placeholders
  pendientes de branding real.
- **Linter**: `oxlint` (no ESLint).
- **Sin**: router, librería de formularios, CSS-in-JS, gestor de estado global, tests automatizados.
- **Despliegue**: Vercel, auto-deploy en push a `main`. Sin `vercel.json` (no hace falta, no hay rutas de
  cliente que configurar).

### Scripts (`package.json`)
- `npm run dev` — servidor de desarrollo (Vite).
- `npm run build` — `tsc -b && vite build` (type-check estricto + build de producción).
- `npm run lint` — `oxlint`.
- `npm run preview` — sirve el build de producción localmente.

### Dependencias de producción
`@supabase/supabase-js`, `lucide-react`, `react` + `react-dom` (v19), `recharts`.

---

## 3. Estructura de carpetas (`src/`)

```
src/
  App.tsx                 — orquestador raíz: todos los hooks de datos, todo el estado de navegación,
                             todos los modales, y el wiring de props hacia las 5 pestañas.
  index.css, main.tsx, vite-env.d.ts

  components/              — 25 componentes reutilizables (ver sección 7)
  features/
    ajustes/                (AjustesTab + 4 editores: Categorías, Recurrentes, Ingresos, Inversión)
    anual/                  (AnualTab, un solo archivo)
    fondos/                 (FondosTab, un solo archivo)
    mensual/                (MensualTab, un solo archivo)
    movimientos/            (MovimientosTab, un solo archivo)
  hooks/                   — 12 hooks de datos, un dominio cada uno (ver sección 6)
  lib/
    backup.ts               — export/import JSON completo de la cuenta
    calculations.ts         — TODA la lógica de negocio pura (sin React, sin I/O) — ver sección 5
    constants.ts             — límites free, semillas de categorías por defecto, paleta de meses, etc.
    env.ts                   — flag isLocalBackend
    format.ts                — helpers de fecha/moneda (todayISO, fmt, monthKey, round2, etc.)
    localStore.ts            — wrapper de localStorage (modo local)
    mappers.ts                — conversión DB row (snake_case) <-> modelo de dominio (camelCase)
    supabaseClient.ts         — cliente Supabase singleton
    tourSteps.ts               — pasos del tour guiado
  types/
    index.ts                 — modelo de dominio (camelCase) — ver sección 4
    db.ts                     — formas de fila de Supabase (snake_case) — ver sección 4
```

`ajustes` es la única carpeta de feature con sub-editores propios; las otras 4 pestañas son un único
archivo cada una.

## 4. Modelo de datos

### 4.1 Dominio (`src/types/index.ts`, camelCase — lo que usa el resto de la app)

```typescript
export type TransactionType = "ingreso" | "gasto" | "aportacion" | "retiro" | "inversion";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO "YYYY-MM-DD"
  category: string;           // nombre "congelado" al crear el movimiento (fallback de visualización)
  categoryId?: string | null; // referencia estable a Category.id (solo gastos) — fuente de verdad
  subcategory: string | null;
  subcategoryId?: string | null;
  note: string;
  fixed?: boolean | null;     // solo gastos: true = fijo, false = variable
  fundId?: string | null;     // solo aportacion/retiro
  fundedBy?: string | null;   // solo gastos: id de fondo o "ahorro_libre" (AHORRO_LIBRE_ID)
  splitId?: string | null;    // gastos divididos entre ingreso y fondo (2 filas con el mismo splitId)
  recurringId?: string | null;
  recurringIncomeId?: string | null;
}

export interface Fund {
  id: string;
  name: string;
  goalAmount?: number | null;  // meta de ahorro opcional (premium)
  isActive?: boolean;          // ver sección 8.3 — mecanismo "fondos activos"
}
export interface FundWithBalance extends Fund { balance: number; virtualTotalAportado?: number; }

export interface Subcategory { id: string; name: string; }
export type CategoryType = "fixed" | "variable";
export interface Category {
  id: string;
  type: CategoryType;
  name: string;
  subcategories: Subcategory[];
  budget?: number | null;  // solo variables
  sortOrder: number;
  isActive?: boolean;       // ver sección 8.3 — mecanismo "categorías activas"
}

export interface Recurring { id: string; categoryId: string; subcategory: string | null; amount: number; note: string; day: number | null; }
export type IncomeCategory = "Ingreso fijo" | "Ingreso extra";
export interface RecurringIncome { id: string; incomeCat: IncomeCategory; name: string; amount: number; note: string; day: number | null; }

export interface Asset { id: string; name: string; pct: number; }
export interface AssetWithTotal extends Asset { invertido: number; }
export interface InvestmentConfig { globalPct: number; }
export type SubscriptionPlan = "free" | "premium";
```

### 4.2 Filas de Supabase (`src/types/db.ts`, snake_case)

Reflejan 1:1 `supabase/schema.sql` (sección 4.3). `src/lib/mappers.ts` traduce en ambas direcciones.

### 4.3 Esquema Postgres (`supabase/schema.sql`, fuente de verdad actual)

Tablas (todas con RLS activada y 4 policies `select/insert/update/delete_own` idénticas basadas en
`auth.uid() = user_id`, generadas en un bloque `do $$ ... $$` que itera sobre la lista de tablas):

- **`funds`**: `id, user_id, name, goal_amount, is_active (default true), created_at`.
- **`categories`**: `id, user_id, type (fixed|variable), name, subcategories jsonb, budget, sort_order, is_active (default true), created_at`.
- **`recurring`**: gastos fijos preestablecidos — `category_id` FK not null on delete cascade.
- **`recurring_income`**: ingresos recurrentes — `income_cat` check ('Ingreso fijo'|'Ingreso extra').
- **`assets`**: activos de inversión — `pct` (reparto %).
- **`investment_config`**: una fila por usuario, `global_pct`.
- **`variable_budget`**: una fila por usuario, `amount` (presupuesto global de gasto variable).
- **`user_settings`**: una fila por usuario — `onboarding_completed`, `savings_milestone_shown`,
  `updated_at`. (Nota: llegó a tener `active_funds_locked_until`/`active_categories_locked_until` para
  un bloqueo mensual a nivel de cuenta; se sustituyó por un bloqueo derivado de las transacciones — ver
  sección 8.4 — así que esas dos columnas ya no las lee la app aunque puedan seguir existiendo en la
  base de datos de quien ejecutó una versión anterior de este archivo.)
- **`subscriptions`**: `plan (free|premium)`, `status (active|cancelled|past_due)`, campos de Stripe
  (`stripe_customer_id`, `stripe_subscription_id`, `current_period_start/end`). **Si un usuario no tiene
  fila aquí, se considera free** — no hay fila automática al registrarse. `fromSubscriptionRow` en
  `mappers.ts` también trata `plan=premium` con `status != active` como free (pago fallido/cancelado).
  ⚠️ No se ha encontrado integración real de Stripe en el código (`package.json` no tiene SDK de Stripe);
  probablemente el flujo de cobro real vive fuera de este repo (Supabase Edge Function u otro servicio) o
  aún no está implementado — el plan se cambia manualmente por SQL durante el desarrollo.
- **`transactions`**: la tabla central. `type` check (ingreso|gasto|aportacion|retiro|inversion).
  `category_id` (FK a categories, on delete set null) es la fuente de verdad para agrupar por categoría;
  `category` (texto) es un snapshot de visualización que sobrevive a renombrados. `subcategory_id` **no
  tiene FK real** (las subcategorías viven dentro del jsonb de `categories.subcategories`, se valida en
  la aplicación). `fund_id` (on delete set null), `funded_by` (id de fondo o `"ahorro_libre"`, sin FK —
  es un string libre), `split_id` (sin FK, solo agrupa dos filas del mismo gasto dividido),
  `recurring_id`/`recurring_income_id` (on delete set null).

Índices sobre `(user_id, date desc)`, `(user_id, type)`, `split_id`/`fund_id`/`category_id` parciales
(`where ... is not null`), y `user_id` en el resto de tablas.

**Regla crítica repetida en varios comentarios del esquema**: los saldos de fondos y el total invertido
**nunca se guardan**, siempre se derivan sumando `transactions` (ver `fundsWithBalance`/`assetsWithTotal`
en `calculations.ts`). Esto hace el sistema "autocurativo": borrar un movimiento corrige automáticamente
todos los saldos derivados sin necesidad de triggers ni recálculos manuales.

---

## 5. Lógica de negocio central (`src/lib/calculations.ts`)

Módulo puro (sin React, sin I/O): recibe arrays de dominio y devuelve valores/estructuras derivadas.
Es el módulo más importante para entender la app correctamente.

### 5.1 Terminología del ahorro — CRÍTICA (ver también `docs/ESPECIFICACION-APP-FINANZAS.md`)

Tres términos con significado exacto, usados en toda la app sin sinónimos:

- **Ahorro libre consolidado**: lo que sobró en meses *anteriores* sin usar. Dinero cerrado, gastable
  marcando "pagado con ahorro". `ahorroLibreDisponibleParaMes(mKey) = ahorroLibreHasta(prevMonthKey(mKey))`.
- **Ahorro libre en curso**: lo que sobra en el mes que se está mirando. Si es el mes actual, puede
  cambiar; si es un mes cerrado, ya es definitivo. NO se puede gastar como ahorro todavía — solo se
  convierte en consolidado cuando el mes cierra. `= ahorroLibreHasta(mes) - ahorroLibreHasta(prevMonthKey(mes))`.
- **Ahorro libre** (a secas): consolidado + en curso.

Fórmula base:
```
ahorroLibreHasta(mKey) =
    SUM(ingresos + retiros hasta mKey)
  − SUM(gastos ordinarios hasta mKey)          // gastos SIN fundedBy
  − SUM(aportaciones hasta mKey)
  − SUM(inversiones hasta mKey)
  − SUM(gastos pagados con ahorro_libre hasta mKey)
```

Regla de verificación: si se puede gastar ya → "consolidado". Si no todavía → "en curso". Si es la suma
→ "libre" a secas. La inversión **no** es ahorro (puede perder valor); los gastos pagados con fondos
**no** reducen el ahorro del mes (se descuentan del fondo, no del flujo mensual).

### 5.2 Inventario de funciones exportadas

**Fondos/activos (saldo derivado):**
- `fundsWithBalance(funds, tx)` — saldo actual = aportado − retirado − usado, histórico completo.
- `fundAvgNetContribution(tx, fundId, monthsCount)` — media de aportación neta mensual (últimos N meses,
  mes actual incluido) — usado para estimar "a este ritmo lo alcanzas en X meses" en la meta de fondo.
- `fundsBalanceHasta(funds, tx, mKey)` — igual que arriba pero "a fecha de" un mes (vista histórica de
  Fondos).
- `assetsWithTotal(assets, tx)` / `assetsHasta(assets, tx, mKey)` — igual para inversión.

**Ahorro libre:**
- `ahorroLibreHasta(tx, mKey)` — fórmula base (arriba).
- `ahorroLibreDisponibleParaMes(tx, mKey)` — el "consolidado" disponible para gastar en ese mes.
- `ahorroLibrePseudoFund(tx)` — construye un "fondo" sintético (`id: AHORRO_LIBRE_ID`) para que el ahorro
  libre se pueda elegir en los mismos selectores que los fondos reales.

**Estadísticas mensuales:**
- `computeMonth(tx, mKey)` → `MonthStats`: ingresos, fixedOrdinario, variableOrdinario, gastosOrdinarios,
  gastosFinanciados, gastosFinanciadosLibre (subset pagado específicamente con ahorro_libre),
  gastosTotal, aportaciones, inversion, ahorroTotal (ingresos − gastosOrdinarios), ahorroReal (=
  "ahorro libre en curso" = ahorroTotal − aportaciones − inversion).

**Series anuales/tendencia:**
- `yearMonthsData(tx, year)` → 12 puntos con ingresos/gastos/ahorroReal/tasaAhorro/**acumulado**.
  ⚠️ `acumulado` se calcula **antes** de sumar la contribución del propio mes (snapshot previo) — así
  representa "consolidado a fecha de ese mes", no "total a cierre de ese mes". Confundir esto rompe el
  gráfico anual de ahorro consolidado (ya ocurrió una vez en este proyecto, ver sección 10).
- `yearTotals(data)` — suma un array de `yearMonthsData`.
- `yearTotalsThroughMonth(tx, year, monthIdxInclusive)` — totales de solo los primeros N meses (para
  comparar años de forma homogénea, p. ej. ene–jul de dos años distintos).
- `buildYearComparison(tx, year, compareYear)` — combina dos años mes a mes; si `year` es el año en
  curso, pone `null` en los meses futuros (para que la línea corte en vez de caer a 0).
- `trendUltimos6Meses(tx, year, monthIdx)` — últimos 6 meses de `ahorroReal` (sparkline de Mensual).

**Preestablecidos pendientes:**
- `computePendingPresets({monthTx, recurring, recurringIncome, investmentConfig, assets})` — qué
  ingresos/gastos recurrentes y **qué activos de inversión individuales** (no un check global) faltan
  por aplicar este mes.

**Insights automáticos (premium):**
- `buildMonthlyInsights(tx, categories, year, monthIdx, isPremium)` → hasta 3 `Insight[]`. Guarda de
  arranque en frío: devuelve `[]` si no hay ingresos este mes o no hay ingresos en ningún otro mes.
  Tipos (en orden de prioridad): `categoria_subida` (premium, mayor subida % de una categoría vs mes
  anterior, umbral >25% y >50€), `presupuesto_racha` (premium, racha más larga de meses superando
  presupuesto de una categoría, mínimo 2, escanea hasta 24 meses atrás), `tasa_ahorro` (**visible en
  free**, es el insight "gancho" hacia premium), `gasto_variable_baja` (premium, bajada >15% vs mes
  anterior), `racha_ahorro` (premium, meses consecutivos con `ahorroReal` positivo, mínimo 3).

**Categorías huérfanas (capa de seguridad ante renombrados/borrados):**
- `matchesCategory`/`resolveCategoryName`/`isOrphanGasto` y sus equivalentes de subcategoría —
  matching por `categoryId` (fuente de verdad) con fallback a nombre para datos antiguos/importados sin
  id.
- `groupOrphanCategories(tx, categories)` / `groupOrphanSubcategories(tx, categories)` — agrupan gastos
  cuya categoría/subcategoría ya no existe y sugieren la categoría actual más parecida (coincidencia de
  substring, la más específica gana). Alimentan `ResolveOrphansModal.tsx` y el aviso en Movimientos.

**Desgloses (Mensual/Anual):**
- `buildBreakdown(monthTx, categories, mode)` — por categoría + subcategoría + "sin clasificar" +
  presupuesto, modo `fixedOrdinario | variableOrdinario | financiado`.
- `buildFundUsage(monthTx, tx, funds)` — qué se gastó de cada fondo este mes, desglosado por categoría.
- `buildAssetBreakdown(monthTx, assets)` / `buildAssetYearBreakdown(tx, assets, year)` — inversión del
  mes / del año por activo.

**Visualización:**
- `mergeSplitDisplay(monthTx, funds)` — fusiona pares de transacciones con el mismo `splitId` en una
  sola fila visual (importe sumado + etiqueta de la parte pagada con fondo).

---

## 6. Hooks (`src/hooks/`, 12 archivos)

Todos siguen el mismo patrón dual: `isLocalBackend` bifurca a `readLocal`/`writeLocal` (localStorage) o
a llamadas Supabase vía `getSupabase()` + mappers. Todos exponen `{ datos, loading, error, ...acciones,
refetch }`.

| Hook | Dominio |
|---|---|
| `useAuth` | Sesión/usuario (mock local en modo local, sesión real de Supabase Auth en modo supabase) |
| `useTransactions` | Movimientos — el hook más central. `addTransaction` maneja el caso de gasto dividido (`splitFundId`/`splitFundAmount`) creando 2 filas con el mismo `splitId` |
| `useFunds` | Fondos — incluye `updateFundGoal`, `updateFundActive`. Orden por `created_at, id` (ver sección 10, bug de reordenación) |
| `useCategories` | Categorías — auto-siembra las categorías por defecto (`DEFAULT_CATEGORY_SEEDS` en `constants.ts`) si la lista está vacía al primer login/local. Incluye `updateCategoryActive` |
| `useRecurring` / `useRecurringIncome` | Preestablecidos de gasto fijo / ingreso |
| `useAssets` | Activos de inversión |
| `useInvestmentConfig` | Config global de % de inversión (una fila) |
| `useVariableBudget` | Presupuesto global de variable (una fila) |
| `useOnboardingStatus` | Flag de tour completado. Tiene un patrón especial: `loading` se deriva comparando `userId !== fetchedForUserId` en vez de un `useState` propio, para evitar un flash de "tour no visto" al reabrir la PWA (race condition ya corregida) |
| `useSavingsMilestone` | Flag de aviso "ya llevas 500€ ahorrados" (deliberadamente independiente de `useOnboardingStatus` aunque comparten tabla `user_settings`) |
| `useSubscription` | Plan freemium — ver sección 8 |

---

## 7. Componentes (`src/components/`, 25 archivos)

| Archivo | Qué hace |
|---|---|
| `NuevoMovimientoForm.tsx` | El formulario modal central (crear/editar cualquier tipo de movimiento). Gating premium: fondos/categorías activas, tipo "Invertir" bloqueado para free (con corona+tooltip) |
| `ApplyPresetsModal.tsx` | Aplicar de golpe ingresos/gastos fijos/inversión pendientes del mes |
| `ResolveOrphansModal.tsx` | Reasignación masiva de categorías/subcategorías huérfanas |
| `MonthSwitcher.tsx` | Navegador de mes/año compartido (Movimientos/Fondos/Mensual). Rejilla de 12 meses con puntos de color según `ahorroReal`. Gating premium: límite de meses hacia atrás (`FREE_HISTORY_MONTHS`) |
| `PremiumGate.tsx` | Banner de upsell reutilizable, no bloqueante: icono `Crown` + `bg-amber-50 text-amber-800 border-amber-200` |
| `CategoryOverviewDonut.tsx`, `ChartsSection.tsx`, `ChartCard.tsx`, `BudgetComplianceChart.tsx`, `SparklineTrend.tsx`, `YearComparisonCards.tsx` | Gráficos (Recharts) |
| `CategoryGroup.tsx` / `CategoryCard.tsx` / `FundUsageGroup.tsx` / `FundUsageCard.tsx` / `GroupHeader.tsx` | Bloques colapsables de desglose (Mensual) |
| `MonthlyInsights.tsx` | Renderiza los `Insight[]` de `calculations.ts` |
| `GuidedTour.tsx` / `HelpModal.tsx` | Onboarding guiado + FAQ |
| `LoginScreen.tsx` | Login/signup (solo modo Supabase) |
| `MilestoneNotice.tsx` / `Toast.tsx` | Modal centrado no-auto-dismiss vs. toast flotante auto-dismiss |
| `Chip.tsx`, `StatCard.tsx`, `Row.tsx`, `NavButton.tsx` | Piezas de UI genéricas reutilizadas en todas las pestañas |

---

## 8. Sistema freemium

### 8.1 Constantes (`src/lib/constants.ts`)
```ts
export const FREE_MAX_FUNDS = 2;
export const FREE_MAX_CATEGORIES: Record<CategoryType, number> = { fixed: 6, variable: 6 };
export const FREE_HISTORY_MONTHS = 6;
```

### 8.2 `useSubscription(userId)`
Lee la tabla `subscriptions`. Sin fila → `"free"`. `plan="premium"` con `status != "active"` → también
`"free"` (fail-closed ante cualquier error de query, no se queda con estado stale). Expone
`isPremium`, `canCreateFund(count)`, `canCreateCategory(count, type)`, `canNavigateToMonth(date)`.

### 8.3 Mecanismo "activos": fondos y categorías

Cuando un free tiene **más** elementos que su límite (por downgrade de premium→free, o por importar el
backup de una cuenta premium), no se le borra nada: puede **ver y usar en histórico** todos sus
fondos/categorías, pero solo puede **crear movimientos nuevos** con los que tenga marcados como
"activos" (máx. `FREE_MAX_FUNDS` / `FREE_MAX_CATEGORIES[type]`).

- Columna `is_active` en `funds` y `categories` (default `true`).
- UI: un "pill" toggle por elemento ("Fondo activo ✓" / "Marcar como activo") en `FondosTab.tsx` y
  `CategoriasEditor.tsx`, visible solo cuando el free supera el límite de ese tipo.
- **Reconciliación automática** (dos `useEffect` en `App.tsx`): en cada carga, si un free tiene más
  elementos **activos** que su límite (típico justo después de un downgrade o una importación, donde
  todo llega con `is_active=true`), se desactivan todos para que el usuario elija su selección desde
  cero. Es autolimitado (deja de disparar en cuanto el recuento baja del límite).
- **Fondos**: "Retirar" y "pagado con ahorro" funcionan siempre en cualquier fondo (activo o no) — el
  usuario nunca debe quedarse sin acceso a su propio dinero. Solo "Aportar" (y el selector de fondo al
  crear una aportación en `NuevoMovimientoForm`) está restringido a fondos activos.
- **Categorías**: el selector de categoría al crear un **gasto** solo muestra las activas (por tipo,
  fijo/variable independientes). El resto de la app (Movimientos, Mensual, Anual, listado de Ajustes,
  presupuestos, preestablecidos) sigue usando/mostrando todas sin filtrar — solo se filtra ese selector
  concreto.
- En premium, `is_active` se ignora por completo en todas partes.

### 8.4 Bloqueo mensual de la selección activa

Para impedir que un free vaya rotando cuál de sus N fondos/categorías usa cada mes (esquivando el
límite en la práctica), la selección se **fija** en cuanto se **usa**:

- **Fondos**: en cuanto un fondo activo recibe una aportación este mes, ese fondo concreto no se puede
  desactivar hasta el mes siguiente (el otro hueco, si no se ha usado, sigue libre). Se muestra con una
  corona 👑 junto al nombre del fondo; tocarla abre un tooltip (mismo patrón que `MonthlyInsights`)
  con la fecha de desbloqueo y el mensaje premium.
- **Categorías**: mismo patrón — una categoría activa con un gasto registrado este mes queda fija hasta
  el mes siguiente, corona junto al nombre.
- **Importante — historial de diseño**: la primera implementación guardaba una fecha de bloqueo **a
  nivel de cuenta** (`active_funds_locked_until`/`active_categories_locked_until` en `user_settings`),
  lo que bloqueaba **todos** los toggles a la vez en cuanto se usaba solo uno de ellos (bug real,
  reportado y corregido). El diseño actual **no usa esas columnas ni ninguna tabla**: el estado
  "bloqueado" se deriva en cada render directamente de `transactions` (`¿hay una aportación/gasto de
  este fondo/categoría con fecha de este mes?`), por fondo/categoría individual. El hook
  `useActiveSelectionLocks` y esas dos columnas fueron eliminados del código por quedar sin uso (las
  columnas pueden seguir existiendo físicamente en bases de datos antiguas, son inofensivas).
- El texto informativo gris ("Elige tus N fondos/categorías activos...") es **siempre visible** para
  free cuando el mecanismo aplica, independientemente del estado de bloqueo — no depende de si queda
  algo por elegir.
- Editar un movimiento existente **nunca** dispara ni depende del bloqueo (el enunciado del feature es
  literalmente sobre "crear", no sobre editar).

### 8.5 Otros puntos de gating premium (por pestaña)

- **Movimientos**: gasto dividido (cubrir con fondo) es premium-only; free lo guarda directo dejando el
  ahorro real en negativo. Aviso de presupuesto en free usa el presupuesto **global** de variable, no el
  de categoría (que es premium-only). Preestablecidos de inversión no se muestran a free.
- **Fondos e inversión**: límite de `FREE_MAX_FUNDS` fondos creables; la sección de activos/inversión
  (gestión y "Invertir") es premium-only, free solo ve el total agregado. Meta de ahorro por fondo es
  premium-only.
- **Mensual**: sparkline de 6 meses se recorta a 3 en free (con aviso inline atenuado, sin `PremiumGate`);
  subcategorías se ocultan del desglose en free (refuerzo defensivo, ya que crear subcategorías es
  premium-only desde Ajustes); insights automáticos son premium salvo el de "tasa de ahorro" (gancho).
- **Anual**: todo lo que no sea la rejilla superior de 4-5 StatCards está detrás de un `PremiumGate` de
  pantalla completa (donut, los 6 gráficos, comparativa entre años) — es la pestaña más restringida.
- **Ajustes**: límite de `FREE_MAX_CATEGORIES` por tipo; subcategorías y presupuesto por categoría son
  premium-only (inputs simplemente no se muestran, sin aviso propio repetido — hay un único `PremiumGate`
  genérico arriba de "Categorías fijas"); sección de Inversión sustituida por `PremiumGate`.
- **Historial**: `MonthSwitcher` bloquea navegar más de `FREE_HISTORY_MONTHS` atrás (botón "‹" y la
  rejilla de 12 meses del desplegable, ambos deshabilitados con aviso).

### 8.6 Importación/exportación (`src/lib/backup.ts`)

`buildBackup`/`downloadBackup` exportan un JSON con todo (transactions, funds, categories, recurring,
recurringIncome, assets, investmentConfig, variableBudget). **La importación nunca se bloquea por
plan** — un free puede importar datos completos de una cuenta premium (más fondos/categorías/
subcategorías/activos de los que su plan permitiría crear); las restricciones de plan se aplican después,
solo a la funcionalidad (crear nuevos elementos, aportar, etc.), nunca a la importación en sí.

`importToSupabase` borra todo lo existente del usuario y reinserta desde el JSON. **Detalle importante**:
genera **ids nuevos** para categories/funds/recurring/recurring_income/assets/transactions y remapea
todas las referencias cruzadas (categoryId, fundId, funded_by, recurringId, recurringIncomeId) — no
reutiliza los ids originales del backup, porque esas claves primarias son globales (no van acompañadas
de `user_id`), así que reutilizarlas rompía con "duplicate key" si el backup venía de OTRA cuenta que
seguía existiendo en la base de datos (p. ej. importar el export de la cuenta premium en una cuenta free
distinta). `subcategory_id` sí se conserva tal cual (vive en el jsonb de la categoría, sin FK real, no
hay riesgo de colisión). Fondos importados conservan `goal_amount`/`is_active` del backup.

---

## 9. Autenticación, multi-usuario y modo local

- Modo Supabase: email/password vía Supabase Auth (`LoginScreen.tsx`), RLS por `auth.uid() = user_id` en
  todas las tablas.
- Modo local (`VITE_DATA_BACKEND=local`): un usuario mock, sin login, todo en `localStorage` con prefijo
  `mis-cuentas:`. Pensado para desarrollo/demo.
- Cuenta premium de referencia (desarrollador): email `ruben1.cozar@gmail.com`,
  `user_id = 93847357-cff2-4684-9081-2b2c0fba2c09` (marcada premium al final de `schema.sql`).

## 10. Decisiones no obvias, invariantes y errores ya corregidos (útil para una auditoría)

Esta sección resume clases de bugs que ya han aparecido en este proyecto — relevante para que una
revisión sepa qué patrones vigilar específicamente:

1. **Saldos derivados, nunca guardados** (fondos, activos de inversión): cualquier cambio que empiece a
   persistir un saldo directamente rompería el sistema "autocurativo" descrito en la sección 4.3.
2. **`acumulado` en `yearMonthsData` debe snapshotearse antes de sumar el mes en curso** — confundir esto
   con "total a cierre de mes" ya causó un desfase de un mes entre el gráfico anual y la tarjeta
   "Consolidado" de Fondos; el fix fue snapshotear el valor previo antes de acumular.
3. **IDs de import**: las tablas `categories`/`funds`/`recurring`/`recurring_income`/`assets`/
   `transactions` tienen clave primaria global (no compuesta con `user_id`). Cualquier flujo que
   reutilice ids de un JSON/origen externo debe regenerarlos y remapear referencias — ya causó un
   "duplicate key" real al importar entre cuentas distintas (sección 8.6).
4. **Ties en `ORDER BY created_at` sin desempate**: los fondos insertados en una misma importación (un
   solo `INSERT` con varias filas) comparten el mismo `created_at` a nivel de Postgres. Sin una columna
   de desempate, el orden de fila devuelto podía cambiar tras cualquier `UPDATE` de una de esas filas
   (reubicación física de la tupla), dando la sensación de que la lista "saltaba" de posición al marcar
   un fondo como activo. Fix: `order("created_at").order("id")` en `useFunds.refetch()`. Vigilar si
   aparece el mismo patrón en otras tablas con inserciones masivas (`categories` usa `sort_order`
   explícito, así que no le afecta).
5. **Errores de red/DB silenciados sin feedback**: el botón de confirmar importación llamaba a una
   función async sin `try/catch`; si `importToSupabase` lanzaba una excepción, la promesa rechazada no
   llegaba a ningún sitio — el modal se quedaba abierto sin ningún mensaje visible ("no pasa nada" fue
   el síntoma reportado). Patrón a vigilar: cualquier `onClick={async () => { await algoQuePuedeLanzar();
   ... }}` sin `try/catch` que además actualice estado de error.
6. **Bloqueo "todo o nada" vs. bloqueo por elemento**: el primer diseño del bloqueo mensual (sección 8.4)
   usaba un flag de cuenta que bloqueaba TODOS los toggles al usar solo UNO. Patrón a vigilar en
   cualquier mecanismo de "N elementos con límite": el estado de bloqueo/uso debe derivarse por elemento
   individual, no como un flag global, si la intención es "cada elemento se bloquea cuando se usa él
   mismo".
7. **Listeners globales de `document` son arriesgados**: un intento anterior de "cerrar tooltip al tocar
   fuera" usando `document.addEventListener("pointerdown", ...)` global rompió la navegación de toda la
   app (interceptaba taps antes de que otros elementos los procesaran). Se revirtió; el patrón final usa
   `onClick` local scoped al propio contenedor del gráfico ("toca el gráfico otra vez para cerrar").
8. **Remontar componentes de Recharts vía `key` bump reinicia las animaciones de entrada** — hay que
   pasar `isAnimationActive={false}` explícitamente tras el primer montaje (patrón render-prop en
   `ChartCard.tsx`) si el remount es solo para resetear el tooltip, no para reanimar.
9. **Categorías huérfanas por id**: renombrar/borrar una categoría no debe romper el histórico de
   movimientos — de ahí el sistema completo de `categoryId` como fuente de verdad +
   `resolveCategoryName`/`groupOrphanCategories` como capa de recuperación.
10. **Reordenar el flujo de hooks en `App.tsx` es seguro** siempre que cada hook individual mantenga su
    propio orden de llamada entre renders (regla de hooks de React) — se ha hecho varias veces sin
    problema al añadir nuevas dependencias entre hooks.

## 11. Huecos / pendientes conocidos

- **Iconos de PWA son placeholders** — falta branding real.
- **Sin tests automatizados** de ningún tipo (unitarios, integración, e2e).
- **Integración de cobro (Stripe) no visible en este repo** — `subscriptions` tiene columnas de Stripe
  pero no hay SDK ni webhooks en `src/`; el cambio de plan se hace manualmente por SQL en desarrollo. Si
  hay una función serverless o webhook real, vive fuera de este repositorio.
- **Bundle único de ~965 KB** (aviso de Vite en cada build) — candidato a code-splitting si el análisis
  de rendimiento lo prioriza; no se ha tocado hasta ahora.
- **Sin columnas `active_funds_locked_until`/`active_categories_locked_until` en uso** (ver 8.4) —
  pueden seguir existiendo físicamente en bases de datos que ejecutaron una versión antigua de
  `schema.sql`; se pueden eliminar opcionalmente (comando incluido en el propio `schema.sql`).
- `docs/ESPECIFICACION-APP-FINANZAS.md` y `README.md` **no documentan el sistema freemium** — ambos
  documentos son anteriores a esa capa; este archivo (`CONTEXTO-APP-PARA-IA.md`) es el único que la
  cubre de forma completa a día de hoy.

## 12. Otros documentos del repo

- `README.md` — guía de desarrollo/despliegue, notas de UX móvil (safe-area insets, tamaño mínimo de
  fuente en inputs para evitar zoom automático de iOS, `dvh` en modales, fix de redondeo de flotantes en
  los puntos de color del `MonthSwitcher`), estado de la migración.
- `docs/ESPECIFICACION-APP-FINANZAS.md` — especificación funcional original (modelo de datos en prosa,
  terminología del ahorro, specs de UX por pestaña, reglas de negocio, sistema de diseño visual). Sigue
  siendo la referencia para el comportamiento base no relacionado con freemium.
- `docs/gestor-finanzas.jsx` — prototipo original de un solo archivo, solo como referencia histórica de
  comportamiento visual; no es código vivo.
- `supabase/schema.sql` — fuente de verdad del esquema de base de datos, idempotente (`create table if
  not exists`, `add column if not exists`), pensado para pegarse entero en el SQL Editor de Supabase.
