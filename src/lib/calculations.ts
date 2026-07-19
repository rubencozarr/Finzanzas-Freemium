// Lógica financiera pura, migrada de gestor-finanzas.jsx siguiendo
// docs/ESPECIFICACION-APP-FINANZAS.md como fuente de verdad.
//
// Terminología del ahorro (ver spec, sección "TERMINOLOGÍA DEL AHORRO"):
// - "Ahorro libre consolidado": ahorroLibreHasta(prevMonthKey(mes)). Ya se puede gastar.
// - "Ahorro libre en curso": computeMonth(mes).ahorroReal — el flujo propio de ESE mes (ingresos menos
//   gastos ordinarios, aportaciones e inversión). OJO: NO es ahorroLibreHasta(mes) -
//   ahorroLibreHasta(prevMonthKey(mes)): esa resta arrastra también los gastos "pagados con ahorro
//   consolidado" del mes, que tiran del consolidado ya acumulado en meses anteriores, no del flujo que
//   ese mes está generando (bug real, corregido en FondosTab.tsx — ver comentario ahí).
// - "Ahorro libre": consolidado + en curso.

import { AHORRO_LIBRE_ID, MONTHS_ES } from "./constants";
import { fmt, monthKey, prevMonthKey } from "./format";
import type {
  Asset,
  AssetWithTotal,
  Category,
  Fund,
  FundWithBalance,
  InvestmentConfig,
  Recurring,
  RecurringIncome,
  Subcategory,
  Transaction,
} from "../types";

// ---------------------------------------------------------------------------
// Fondos y activos: los saldos NUNCA se guardan, siempre se derivan del historial.
// ---------------------------------------------------------------------------

export function fundsWithBalance(funds: Fund[], transactions: Transaction[]): FundWithBalance[] {
  return funds.map((f) => {
    const aportado = transactions
      .filter((t) => t.type === "aportacion" && t.fundId === f.id)
      .reduce((s, t) => s + t.amount, 0);
    const retirado = transactions
      .filter((t) => t.type === "retiro" && t.fundId === f.id)
      .reduce((s, t) => s + t.amount, 0);
    const usado = transactions
      .filter((t) => t.type === "gasto" && t.fundedBy === f.id)
      .reduce((s, t) => s + t.amount, 0);
    return { ...f, balance: aportado - retirado - usado };
  });
}

/** Media de aportaciones netas (aportación - retiro) a un fondo en los últimos `monthsCount` meses,
 * contando el mes actual como el primero (mismo criterio que trendUltimos6Meses). Usada para estimar
 * cuántos meses faltan para alcanzar la meta de ahorro de un fondo. */
export function fundAvgNetContribution(transactions: Transaction[], fundId: string, monthsCount: number): number {
  const now = new Date();
  let total = 0;
  for (let i = 0; i < monthsCount; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthTx = transactions.filter((t) => t.fundId === fundId && monthKey(t.date) === mKey);
    const aportado = monthTx.filter((t) => t.type === "aportacion").reduce((s, t) => s + t.amount, 0);
    const retirado = monthTx.filter((t) => t.type === "retiro").reduce((s, t) => s + t.amount, 0);
    total += aportado - retirado;
  }
  return total / monthsCount;
}

export function fundsBalanceHasta(funds: Fund[], transactions: Transaction[], mKey: string): FundWithBalance[] {
  return funds.map((f) => {
    const rel = transactions.filter((t) => monthKey(t.date) <= mKey);
    const aportado = rel
      .filter((t) => t.type === "aportacion" && t.fundId === f.id)
      .reduce((s, t) => s + t.amount, 0);
    const retirado = rel.filter((t) => t.type === "retiro" && t.fundId === f.id).reduce((s, t) => s + t.amount, 0);
    const usado = rel.filter((t) => t.type === "gasto" && t.fundedBy === f.id).reduce((s, t) => s + t.amount, 0);
    return { ...f, balance: aportado - retirado - usado };
  });
}

export function assetsWithTotal(assets: Asset[], transactions: Transaction[]): AssetWithTotal[] {
  return assets.map((a) => {
    const invertido = transactions
      .filter((t) => t.type === "inversion" && t.category === a.name)
      .reduce((s, t) => s + t.amount, 0);
    return { ...a, invertido };
  });
}

export function assetsHasta(assets: Asset[], transactions: Transaction[], mKey: string): AssetWithTotal[] {
  return assets.map((a) => {
    const invertido = transactions
      .filter((t) => t.type === "inversion" && t.category === a.name && monthKey(t.date) <= mKey)
      .reduce((s, t) => s + t.amount, 0);
    return { ...a, invertido };
  });
}

// ---------------------------------------------------------------------------
// Ahorro libre (consolidado / en curso), "a fecha de"
// ---------------------------------------------------------------------------

export function ahorroLibreHasta(transactions: Transaction[], mKey: string): number {
  const relevant = transactions.filter((t) => monthKey(t.date) <= mKey);
  const ingresosTotal = relevant
    .filter((t) => t.type === "ingreso" || t.type === "retiro")
    .reduce((s, t) => s + t.amount, 0);
  const gastosOrdinariosTotal = relevant
    .filter((t) => t.type === "gasto" && !t.fundedBy)
    .reduce((s, t) => s + t.amount, 0);
  const aportacionesTotal = relevant.filter((t) => t.type === "aportacion").reduce((s, t) => s + t.amount, 0);
  const inversionTotal = relevant.filter((t) => t.type === "inversion").reduce((s, t) => s + t.amount, 0);
  const gastoLibre = relevant
    .filter((t) => t.type === "gasto" && t.fundedBy === AHORRO_LIBRE_ID)
    .reduce((s, t) => s + t.amount, 0);
  return ingresosTotal - gastosOrdinariosTotal - aportacionesTotal - inversionTotal - gastoLibre;
}

// El consolidado disponible baja en directo según se gasta dentro del propio mes: no basta con el
// acumulado hasta el mes anterior, hay que descontar también lo ya gastado "con ahorro consolidado"
// en el mes actual (si no, un segundo gasto el mismo mes vería el mismo saldo sin descontar el primero,
// y "Consolidado" en Fondos no bajaría hasta cerrar el mes).
export function ahorroLibreDisponibleParaMes(transactions: Transaction[], mKey: string): number {
  const gastoLibreEsteMes = transactions
    .filter((t) => t.type === "gasto" && t.fundedBy === AHORRO_LIBRE_ID && monthKey(t.date) === mKey)
    .reduce((s, t) => s + t.amount, 0);
  return ahorroLibreHasta(transactions, prevMonthKey(mKey)) - gastoLibreEsteMes;
}

/** Pseudo-fondo "Ahorro libre acumulado", para mostrarlo junto a los fondos reales. */
export function ahorroLibrePseudoFund(transactions: Transaction[]): FundWithBalance {
  const ingresosTotal = transactions
    .filter((t) => t.type === "ingreso" || t.type === "retiro")
    .reduce((s, t) => s + t.amount, 0);
  const gastosOrdinariosTotal = transactions
    .filter((t) => t.type === "gasto" && !t.fundedBy)
    .reduce((s, t) => s + t.amount, 0);
  const aportacionesTotal = transactions.filter((t) => t.type === "aportacion").reduce((s, t) => s + t.amount, 0);
  const inversionTotal = transactions.filter((t) => t.type === "inversion").reduce((s, t) => s + t.amount, 0);
  const ahorroLibreBruto = ingresosTotal - gastosOrdinariosTotal - aportacionesTotal - inversionTotal;
  const gastoLibreTotal = transactions
    .filter((t) => t.type === "gasto" && t.fundedBy === AHORRO_LIBRE_ID)
    .reduce((s, t) => s + t.amount, 0);
  return {
    id: AHORRO_LIBRE_ID,
    name: "Ahorro libre acumulado",
    balance: ahorroLibreBruto - gastoLibreTotal,
    virtualTotalAportado: ahorroLibreBruto,
  };
}

// ---------------------------------------------------------------------------
// computeMonth
// ---------------------------------------------------------------------------

export interface MonthStats {
  ingresos: number;
  fixedOrdinario: number;
  variableOrdinario: number;
  gastosOrdinarios: number;
  gastosFinanciados: number;
  gastosFinanciadosLibre: number;
  gastosTotal: number;
  aportaciones: number;
  inversion: number;
  ahorroTotal: number;
  ahorroReal: number;
}

export function computeMonth(transactions: Transaction[], mKey: string): MonthStats {
  const tx = transactions.filter((t) => monthKey(t.date) === mKey);
  const ingresos = tx.filter((t) => t.type === "ingreso" || t.type === "retiro").reduce((s, t) => s + t.amount, 0);
  const gastoTx = tx.filter((t) => t.type === "gasto");
  const fixedOrdinario = gastoTx.filter((t) => t.fixed && !t.fundedBy).reduce((s, t) => s + t.amount, 0);
  const variableOrdinario = gastoTx.filter((t) => !t.fixed && !t.fundedBy).reduce((s, t) => s + t.amount, 0);
  const gastosFinanciados = gastoTx.filter((t) => t.fundedBy).reduce((s, t) => s + t.amount, 0);
  const gastosFinanciadosLibre = gastoTx
    .filter((t) => t.fundedBy === AHORRO_LIBRE_ID)
    .reduce((s, t) => s + t.amount, 0);
  const gastosOrdinarios = fixedOrdinario + variableOrdinario;
  const aportaciones = tx.filter((t) => t.type === "aportacion").reduce((s, t) => s + t.amount, 0);
  const inversion = tx.filter((t) => t.type === "inversion").reduce((s, t) => s + t.amount, 0);
  const ahorroTotal = ingresos - gastosOrdinarios;
  const ahorroReal = ahorroTotal - aportaciones - inversion;
  return {
    ingresos,
    fixedOrdinario,
    variableOrdinario,
    gastosOrdinarios,
    gastosFinanciados,
    gastosFinanciadosLibre,
    gastosTotal: gastosOrdinarios + gastosFinanciados,
    aportaciones,
    inversion,
    ahorroTotal,
    ahorroReal,
  };
}

/** % de los ingresos que se queda como ahorro real (ahorro libre en curso + aportaciones a fondos),
 * excluyendo la inversión (que la app trata siempre aparte del ahorro, no como parte de él).
 * gastosOrdinarios ya excluye aportaciones/inversión por construcción (son un `type` de transacción
 * distinto a "gasto"), así que solo hace falta restar la inversión además de gastosOrdinarios. Fuente
 * única para no volver a divergir entre el insight de Mensual y el gráfico de Anual (ya divergían: uno
 * no restaba inversión, el otro restaba también las aportaciones). */
export function tasaAhorroPct(stats: MonthStats): number {
  return stats.ingresos ? ((stats.ingresos - stats.gastosOrdinarios - stats.inversion) / stats.ingresos) * 100 : 0;
}

// ---------------------------------------------------------------------------
// Series anuales / tendencias
// ---------------------------------------------------------------------------

export interface YearMonthData {
  mes: string;
  ingresos: number;
  gastos: number;
  fixedOrdinario: number;
  variableOrdinario: number;
  gastosFinanciados: number;
  inversion: number;
  ahorroReal: number;
  tasaAhorro: number;
  acumulado: number;
}

export function yearMonthsData(transactions: Transaction[], year: number): YearMonthData[] {
  let acumulado = ahorroLibreHasta(transactions, `${year - 1}-12`);
  return Array.from({ length: 12 }, (_, i) => {
    const mKey = `${year}-${String(i + 1).padStart(2, "0")}`;
    const s = computeMonth(transactions, mKey);
    // "acumulado" es el ahorro libre CONSOLIDADO de ese mes (lo generado en meses anteriores, sin
    // contar todavía lo que sobra este mismo mes) — el mismo valor que ahorroLibreDisponibleParaMes()
    // le mostraría a FondosTab si navegases a este mes. Por eso se guarda el snapshot ANTES de sumar la
    // contribución del propio mes: sumarla antes convertiría esto en "ahorro libre total a fin de mes"
    // (consolidado + en curso), que es un concepto distinto aunque tenga el mismo nombre en el gráfico.
    // También hay que restar los gastos pagados con ahorro libre DE ESTE MES (gastosFinanciadosLibre):
    // igual que en Fondos, ese dinero sale del consolidado ya acumulado en cuanto se gasta, no solo al
    // cerrar el mes — si no, este punto del gráfico y "Consolidado" en Fondos divergerían para el mismo
    // mes. El acumulador que pasa al mes siguiente no cambia, ya restaba gastosFinanciadosLibre.
    const consolidadoEsteMes = acumulado - s.gastosFinanciadosLibre;
    acumulado += s.ahorroReal - s.gastosFinanciadosLibre;
    return {
      mes: MONTHS_ES[i],
      ingresos: s.ingresos,
      gastos: s.gastosOrdinarios + s.inversion,
      fixedOrdinario: s.fixedOrdinario,
      variableOrdinario: s.variableOrdinario,
      gastosFinanciados: s.gastosFinanciados,
      inversion: s.inversion,
      ahorroReal: s.ahorroReal,
      tasaAhorro: tasaAhorroPct(s),
      acumulado: consolidadoEsteMes,
    };
  });
}

export interface YearTotals {
  ingresos: number;
  gastos: number;
  ahorroReal: number;
  fixedOrdinario: number;
  variableOrdinario: number;
  gastosFinanciados: number;
  inversion: number;
}

export function yearTotals(data: YearMonthData[]): YearTotals {
  return data.reduce(
    (acc, m) => ({
      ingresos: acc.ingresos + m.ingresos,
      gastos: acc.gastos + m.gastos,
      ahorroReal: acc.ahorroReal + m.ahorroReal,
      fixedOrdinario: acc.fixedOrdinario + m.fixedOrdinario,
      variableOrdinario: acc.variableOrdinario + m.variableOrdinario,
      gastosFinanciados: acc.gastosFinanciados + m.gastosFinanciados,
      inversion: acc.inversion + m.inversion,
    }),
    { ingresos: 0, gastos: 0, ahorroReal: 0, fixedOrdinario: 0, variableOrdinario: 0, gastosFinanciados: 0, inversion: 0 },
  );
}

/** Totales de un año, pero solo de los primeros `monthIdxInclusive + 1` meses — para comparar "los
 * mismos meses" entre dos años (p. ej. enero-julio de este año vs enero-julio del anterior). */
export function yearTotalsThroughMonth(transactions: Transaction[], year: number, monthIdxInclusive: number): YearTotals {
  return yearTotals(yearMonthsData(transactions, year).slice(0, monthIdxInclusive + 1));
}

export interface YearComparisonPoint {
  mes: string;
  ingresos: number | null;
  gastos: number | null;
  fixedOrdinario: number | null;
  variableOrdinario: number | null;
  acumulado: number | null;
  tasaAhorro: number | null;
  compareIngresos: number;
  compareGastos: number;
  compareFixedOrdinario: number;
  compareVariableOrdinario: number;
  compareAcumulado: number;
  compareTasaAhorro: number;
}

/** Serie mensual de `year` combinada con la de `compareYear`, mes a mes por índice. Los meses de
 * `year` posteriores al mes real de hoy (solo si `year` es el año en curso) se ponen a null, para que
 * el año actual "termine" ahí en el gráfico en vez de caer a 0 por falta de datos futuros. El año
 * comparado se muestra siempre completo. */
export function buildYearComparison(transactions: Transaction[], year: number, compareYear: number): YearComparisonPoint[] {
  const current = yearMonthsData(transactions, year);
  const compare = yearMonthsData(transactions, compareYear);
  const today = new Date();
  const cutoff = year < today.getFullYear() ? 11 : year > today.getFullYear() ? -1 : today.getMonth();
  return current.map((m, i) => {
    const withinRange = i <= cutoff;
    return {
      mes: m.mes,
      ingresos: withinRange ? m.ingresos : null,
      gastos: withinRange ? m.gastos : null,
      fixedOrdinario: withinRange ? m.fixedOrdinario : null,
      variableOrdinario: withinRange ? m.variableOrdinario : null,
      acumulado: withinRange ? m.acumulado : null,
      tasaAhorro: withinRange ? m.tasaAhorro : null,
      compareIngresos: compare[i].ingresos,
      compareGastos: compare[i].gastos,
      compareFixedOrdinario: compare[i].fixedOrdinario,
      compareVariableOrdinario: compare[i].variableOrdinario,
      compareAcumulado: compare[i].acumulado,
      compareTasaAhorro: compare[i].tasaAhorro,
    };
  });
}

export interface TrendPoint {
  mes: string;
  value: number;
}

/** Ahorro libre en curso de los últimos 6 meses, terminando en (year, monthIdx). */
export function trendUltimos6Meses(transactions: Transaction[], year: number, monthIdx: number): TrendPoint[] {
  const out: TrendPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, monthIdx - i, 1);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ mes: MONTHS_ES[d.getMonth()], value: computeMonth(transactions, mKey).ahorroReal });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Preestablecidos pendientes
// Nota: a diferencia del prototipo, la inversión se evalúa POR ACTIVO
// (spec: "Bug corregido en esta spec"), no de forma global.
// ---------------------------------------------------------------------------

export interface PendingPresets {
  pendingRecurring: Recurring[];
  pendingIncome: RecurringIncome[];
  pendingInvestmentAssets: Asset[];
  hasInvestmentPlan: boolean;
  pendingInvestment: boolean;
  hasAnyPending: boolean;
  hasAnyConfigured: boolean;
}

export function computePendingPresets(params: {
  monthTx: Transaction[];
  recurring: Recurring[];
  recurringIncome: RecurringIncome[];
  investmentConfig: InvestmentConfig;
  assets: Asset[];
}): PendingPresets {
  const { monthTx, recurring, recurringIncome, investmentConfig, assets } = params;
  const pendingRecurring = recurring.filter((r) => !monthTx.some((t) => t.recurringId === r.id));
  const pendingIncome = recurringIncome.filter((r) => !monthTx.some((t) => t.recurringIncomeId === r.id));
  const hasInvestmentPlan = investmentConfig.globalPct > 0 && assets.length > 0;
  const pendingInvestmentAssets = hasInvestmentPlan
    ? assets.filter((a) => !monthTx.some((t) => t.type === "inversion" && t.category === a.name))
    : [];
  const pendingInvestment = pendingInvestmentAssets.length > 0;
  const hasAnyPending = pendingRecurring.length > 0 || pendingInvestment || pendingIncome.length > 0;
  const hasAnyConfigured = recurring.length > 0 || recurringIncome.length > 0 || hasInvestmentPlan;
  return {
    pendingRecurring,
    pendingIncome,
    pendingInvestmentAssets,
    hasInvestmentPlan,
    pendingInvestment,
    hasAnyPending,
    hasAnyConfigured,
  };
}

// ---------------------------------------------------------------------------
// Insights automáticos de tendencia (Mensual, premium)
// ---------------------------------------------------------------------------

export type InsightType = "categoria_subida" | "presupuesto_racha" | "tasa_ahorro" | "gasto_variable_baja" | "racha_ahorro";

export interface Insight {
  type: InsightType;
  text: string;
  tone: "rose" | "amber" | "teal" | "emerald";
}

/** Gasto por categoría en un mes, sin contar lo pagado con ahorro (fundedBy): eso no sale del
 * ingreso del mes, así que no debe distorsionar comparaciones de gasto mes a mes. */
function categoryTotalsForMonth(transactions: Transaction[], categories: Category[], mKey: string): Record<string, number> {
  const monthTx = transactions.filter((t) => monthKey(t.date) === mKey && t.type === "gasto" && !t.fundedBy);
  const totals: Record<string, number> = {};
  categories.forEach((cat) => {
    totals[cat.id] = monthTx.filter((t) => matchesCategory(t, cat)).reduce((s, t) => s + t.amount, 0);
  });
  return totals;
}

function biggestCategoryIncrease(
  transactions: Transaction[],
  categories: Category[],
  mKey: string,
  prevKey: string,
): { name: string; pct: number; deltaAmount: number } | null {
  const current = categoryTotalsForMonth(transactions, categories, mKey);
  const previous = categoryTotalsForMonth(transactions, categories, prevKey);
  let best: { name: string; pct: number; deltaAmount: number } | null = null;
  categories.forEach((cat) => {
    const prev = previous[cat.id] || 0;
    if (prev <= 0) return; // sin base del mes anterior no hay "% de subida" que tenga sentido
    const deltaAmount = (current[cat.id] || 0) - prev;
    const pct = (deltaAmount / prev) * 100;
    if (pct > 25 && deltaAmount > 50 && (!best || deltaAmount > best.deltaAmount)) {
      best = { name: cat.name, pct, deltaAmount };
    }
  });
  return best;
}

function longestOverBudgetStreak(transactions: Transaction[], categories: Category[], mKey: string): { categoryName: string; months: number } | null {
  const budgetCats = categories.filter((c) => c.type === "variable" && (c.budget || 0) > 0);
  let best: { categoryName: string; months: number } | null = null;
  budgetCats.forEach((cat) => {
    let months = 0;
    let cursor = mKey;
    for (let i = 0; i < 24; i++) {
      const total = transactions
        .filter((t) => monthKey(t.date) === cursor && t.type === "gasto" && !t.fundedBy && matchesCategory(t, cat))
        .reduce((s, t) => s + t.amount, 0);
      if (total > (cat.budget || 0)) {
        months++;
        cursor = prevMonthKey(cursor);
      } else break;
    }
    if (months >= 2 && (!best || months > best.months)) best = { categoryName: cat.name, months };
  });
  return best;
}

function positiveSavingsStreak(transactions: Transaction[], mKey: string): number {
  let months = 0;
  let cursor = mKey;
  for (let i = 0; i < 24; i++) {
    if (computeMonth(transactions, cursor).ahorroReal > 0) {
      months++;
      cursor = prevMonthKey(cursor);
    } else break;
  }
  return months;
}

/** Todos los insights son premium salvo "tasa_ahorro", que se muestra también en free (con un aviso
 * discreto en la propia tarjeta, ver MonthlyInsights.tsx) a modo de anzuelo hacia el resto. */
export function buildMonthlyInsights(
  transactions: Transaction[],
  categories: Category[],
  year: number,
  monthIdx: number,
  isPremium: boolean,
): Insight[] {
  const mKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  const prevKey = prevMonthKey(mKey);
  const stats = computeMonth(transactions, mKey);
  const prevStats = computeMonth(transactions, prevKey);

  const hasIncomeThisMonth = stats.ingresos > 0;
  const hasIncomeSomeOtherMonth = transactions.some((t) => t.type === "ingreso" && monthKey(t.date) !== mKey);
  if (!hasIncomeThisMonth || !hasIncomeSomeOtherMonth) return [];

  const insights: Insight[] = [];

  if (isPremium) {
    const catIncrease = biggestCategoryIncrease(transactions, categories, mKey, prevKey);
    if (catIncrease) {
      insights.push({
        type: "categoria_subida",
        tone: "rose",
        text: `${catIncrease.name} subió un ${catIncrease.pct.toFixed(0)}% respecto al mes pasado (+${fmt(catIncrease.deltaAmount)})`,
      });
    }

    const streak = longestOverBudgetStreak(transactions, categories, mKey);
    if (streak) {
      insights.push({
        type: "presupuesto_racha",
        tone: "amber",
        text: `Llevas ${streak.months} meses superando tu presupuesto de ${streak.categoryName}`,
      });
    }
  }

  if (prevStats.ingresos > 0) {
    const tasa = tasaAhorroPct(stats);
    const tasaPrev = tasaAhorroPct(prevStats);
    const diff = tasa - tasaPrev;
    insights.push({
      type: "tasa_ahorro",
      tone: Math.abs(diff) > 5 ? (diff > 0 ? "emerald" : "rose") : "teal",
      text: `Tu tasa de ahorro este mes: ${tasa.toFixed(0)}% (vs ${tasaPrev.toFixed(0)}% el anterior)`,
    });
  }

  if (isPremium && prevStats.variableOrdinario > 0) {
    const pctDown = ((prevStats.variableOrdinario - stats.variableOrdinario) / prevStats.variableOrdinario) * 100;
    if (pctDown > 15) {
      insights.push({
        type: "gasto_variable_baja",
        tone: "emerald",
        text: `Tu gasto variable bajó un ${pctDown.toFixed(0)}% respecto al mes pasado`,
      });
    }
  }

  if (isPremium) {
    const rachaAhorro = positiveSavingsStreak(transactions, mKey);
    if (rachaAhorro >= 3) {
      insights.push({ type: "racha_ahorro", tone: "emerald", text: `Llevas ${rachaAhorro} meses consecutivos ahorrando` });
    }
  }

  return insights.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Desgloses por categoría / fondo / activo (para Mensual y Anual)
// ---------------------------------------------------------------------------

export interface CategoryBreakdown {
  name: string;
  total: number;
  subcats: { name: string; total: number }[];
  sinClasificar: number;
  budget: number;
}

/** Subconjunto mínimo de campos necesario para casar un movimiento con su categoría. */
export interface CategoryMatchable {
  type: Transaction["type"];
  category: string;
  categoryId?: string | null;
}

/**
 * Compara un movimiento con una categoría por su id (fuente de verdad, estable frente a
 * renombrados). Solo recurre al nombre como fallback para movimientos antiguos que todavía
 * no tienen categoryId (antes de la migración de backfill, o datos importados sin id).
 */
export function matchesCategory(t: CategoryMatchable, cat: Category): boolean {
  return t.categoryId ? t.categoryId === cat.id : t.category === cat.name;
}

/** Subconjunto mínimo para resolver el nombre "en vivo" del fondo de una aportación/retiro. */
export interface FundMatchable {
  fundId?: string | null;
  category: string;
}

/** Nombre "en vivo" del fondo de una aportación/retiro: siempre refleja el nombre actual, igual que
 * resolveCategoryName para categorías — category es solo el snapshot de texto guardado al crear el
 * movimiento, que queda obsoleto si el fondo se renombra después. */
export function resolveFundName(t: FundMatchable, funds: Fund[]): string {
  if (t.fundId) {
    const fund = funds.find((f) => f.id === t.fundId);
    if (fund) return fund.name;
  }
  return t.category;
}

/** Nombre "en vivo" de la categoría de un movimiento: siempre refleja el nombre actual. */
export function resolveCategoryName(t: CategoryMatchable, categories: Category[]): string {
  if (t.categoryId) {
    const cat = categories.find((c) => c.id === t.categoryId);
    if (cat) return cat.name;
  }
  return t.category;
}

/** Un gasto es "huérfano" si no hay ninguna categoría actual que le corresponda (por id o nombre). */
export function isOrphanGasto(t: CategoryMatchable, categories: Category[]): boolean {
  return t.type === "gasto" && !categories.some((c) => matchesCategory(t, c));
}

/** Subconjunto mínimo de campos necesario para casar un movimiento con su subcategoría. */
export interface SubcategoryMatchable {
  subcategory: string | null;
  subcategoryId?: string | null;
}

/** Igual que matchesCategory, pero para subcategorías (por id, con fallback al nombre). */
export function matchesSubcategory(t: SubcategoryMatchable, sub: Subcategory): boolean {
  return t.subcategoryId ? t.subcategoryId === sub.id : t.subcategory === sub.name;
}

/** Nombre "en vivo" de la subcategoría de un movimiento (null si no tenía ninguna). */
export function resolveSubcategoryName(
  t: CategoryMatchable & SubcategoryMatchable,
  categories: Category[],
): string | null {
  if (!t.subcategory) return null;
  const cat = categories.find((c) => matchesCategory(t, c));
  if (cat) {
    const sub = cat.subcategories.find((sc) => matchesSubcategory(t, sc));
    if (sub) return sub.name;
  }
  return t.subcategory;
}

/**
 * Una subcategoría es "huérfana" cuando su categoría sí existe (si no, ya se gestiona como
 * huérfano de categoría) pero la subcategoría concreta ya no está entre las suyas.
 */
export function isOrphanSubcategory(t: CategoryMatchable & SubcategoryMatchable, categories: Category[]): boolean {
  if (t.type !== "gasto" || !t.subcategory) return false;
  const cat = categories.find((c) => matchesCategory(t, c));
  if (!cat) return false;
  return !cat.subcategories.some((sc) => matchesSubcategory(t, sc));
}

export interface OrphanGroup {
  /** Clave estable para React y para localizar el grupo al reasignarlo. */
  key: string;
  /** Nombre de categoría "congelado" que ya no existe. */
  oldName: string;
  /** Si eran gastos fijos o variables (este dato nunca se corrompe, viene de t.fixed). */
  fixed: boolean;
  count: number;
  totalAmount: number;
  ids: string[];
  /** Mejor candidata detectada automáticamente entre las categorías del mismo tipo (fijo/variable). */
  suggestedCategoryId: string | null;
}

/**
 * Agrupa los movimientos huérfanos por (nombre antiguo + fijo/variable) y sugiere, para cada
 * grupo, la categoría actual más parecida del mismo tipo (por ejemplo "Transporte" huérfano y
 * variable sugiere "Transporte Variable" si existe). Así se puede reasignar un grupo entero de
 * una vez, en lugar de movimiento a movimiento.
 */
export function groupOrphanCategories(transactions: Transaction[], categories: Category[]): OrphanGroup[] {
  const groups = new Map<string, OrphanGroup>();
  for (const t of transactions) {
    if (!isOrphanGasto(t, categories)) continue;
    const fixed = !!t.fixed;
    const key = `${t.category}__${fixed}`;
    let g = groups.get(key);
    if (!g) {
      g = { key, oldName: t.category, fixed, count: 0, totalAmount: 0, ids: [], suggestedCategoryId: null };
      groups.set(key, g);
    }
    g.count += 1;
    g.totalAmount += t.amount;
    g.ids.push(t.id);
  }

  for (const g of groups.values()) {
    const pool = categories.filter((c) => c.type === (g.fixed ? "fixed" : "variable"));
    const oldLower = g.oldName.trim().toLowerCase();
    const matches = pool
      .filter((c) => {
        const nameLower = c.name.trim().toLowerCase();
        return nameLower.includes(oldLower) || oldLower.includes(nameLower);
      })
      .sort((a, b) => a.name.length - b.name.length);
    g.suggestedCategoryId = matches[0]?.id ?? null;
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

export interface OrphanSubcategoryGroup {
  key: string;
  categoryId: string;
  categoryName: string;
  oldSubName: string;
  count: number;
  totalAmount: number;
  ids: string[];
  suggestedSubcategoryId: string | null;
}

/**
 * Igual que groupOrphanCategories, pero para subcategorías huérfanas dentro de una categoría que
 * sí existe (p. ej. se borró "Tapas" de "Ocio"). Agrupa por (categoría + nombre antiguo de
 * subcategoría) y sugiere la subcategoría actual más parecida dentro de esa misma categoría.
 */
export function groupOrphanSubcategories(transactions: Transaction[], categories: Category[]): OrphanSubcategoryGroup[] {
  const groups = new Map<string, OrphanSubcategoryGroup>();
  for (const t of transactions) {
    if (!isOrphanSubcategory(t, categories)) continue;
    const cat = categories.find((c) => matchesCategory(t, c));
    if (!cat || !t.subcategory) continue;
    const key = `${cat.id}__${t.subcategory}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        categoryId: cat.id,
        categoryName: cat.name,
        oldSubName: t.subcategory,
        count: 0,
        totalAmount: 0,
        ids: [],
        suggestedSubcategoryId: null,
      };
      groups.set(key, g);
    }
    g.count += 1;
    g.totalAmount += t.amount;
    g.ids.push(t.id);
  }

  for (const g of groups.values()) {
    const cat = categories.find((c) => c.id === g.categoryId);
    const pool = cat ? cat.subcategories : [];
    const oldLower = g.oldSubName.trim().toLowerCase();
    const matches = pool
      .filter((sc) => {
        const nameLower = sc.name.trim().toLowerCase();
        return nameLower.includes(oldLower) || oldLower.includes(nameLower);
      })
      .sort((a, b) => a.name.length - b.name.length);
    g.suggestedSubcategoryId = matches[0]?.id ?? null;
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

export function buildBreakdown(
  monthTx: Transaction[],
  categories: Category[],
  mode: "fixedOrdinario" | "variableOrdinario" | "financiado",
): CategoryBreakdown[] {
  const relevant =
    mode === "financiado" ? categories : categories.filter((c) => c.type === (mode === "fixedOrdinario" ? "fixed" : "variable"));
  return relevant
    .map((cat) => {
      const catTx = monthTx.filter(
        (t) => t.type === "gasto" && matchesCategory(t, cat) && (mode === "financiado" ? !!t.fundedBy : !t.fundedBy),
      );
      const total = catTx.reduce((s, t) => s + t.amount, 0);
      const subcats = cat.subcategories
        .map((sc) => ({
          name: sc.name,
          total: catTx.filter((t) => matchesSubcategory(t, sc)).reduce((s, t) => s + t.amount, 0),
        }))
        .filter((sc) => sc.total > 0);
      const sinClasificar = catTx.filter((t) => !t.subcategory).reduce((s, t) => s + t.amount, 0);
      return { name: cat.name, total, subcats, sinClasificar, budget: cat.budget || 0 };
    })
    .filter((c) => c.total > 0);
}

export interface FundUsage {
  id: string;
  name: string;
  total: number;
  totalAportado: number;
  pct: number;
  cats: { name: string; total: number; pct: number }[];
}

export function buildFundUsage(
  monthTx: Transaction[],
  transactions: Transaction[],
  funds: FundWithBalance[],
): FundUsage[] {
  return funds
    .map((fund) => {
      const fundTx = monthTx.filter((t) => t.type === "gasto" && t.fundedBy === fund.id);
      const total = fundTx.reduce((s, t) => s + t.amount, 0);
      if (total <= 0) return null;
      const totalAportado =
        fund.virtualTotalAportado != null
          ? fund.virtualTotalAportado
          : transactions.filter((t) => t.type === "aportacion" && t.fundId === fund.id).reduce((s, t) => s + t.amount, 0);
      const catMap: Record<string, number> = {};
      fundTx.forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });
      const cats = Object.entries(catMap)
        .map(([name, amt]) => ({ name, total: amt, pct: totalAportado ? (amt / totalAportado) * 100 : 0 }))
        .sort((a, b) => b.total - a.total);
      return {
        id: fund.id,
        name: fund.name,
        total,
        totalAportado,
        pct: totalAportado ? (total / totalAportado) * 100 : 0,
        cats,
      };
    })
    .filter((f): f is FundUsage => f !== null);
}

export function buildAssetBreakdown(monthTx: Transaction[], assets: Asset[]): CategoryBreakdown[] {
  return assets
    .map((a) => {
      const total = monthTx
        .filter((t) => t.type === "inversion" && t.category === a.name)
        .reduce((s, t) => s + t.amount, 0);
      return { name: a.name, total, subcats: [], sinClasificar: 0, budget: 0 };
    })
    .filter((a) => a.total > 0)
    .sort((a, b) => b.total - a.total);
}

export interface AssetYearBreakdown {
  name: string;
  total: number;
}

/** Inversión por activo dentro de un año concreto (no acumulado). */
export function buildAssetYearBreakdown(transactions: Transaction[], assets: Asset[], year: number): AssetYearBreakdown[] {
  const yearTx = transactions.filter((t) => t.type === "inversion" && t.date.slice(0, 4) === String(year));
  return assets
    .map((a) => ({ name: a.name, total: yearTx.filter((t) => t.category === a.name).reduce((s, t) => s + t.amount, 0) }))
    .filter((a) => a.total > 0)
    .sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------
// Fusión de gastos divididos (splitId) para la lista de movimientos
// ---------------------------------------------------------------------------

export interface DisplayTransactionItem {
  ids: string[];
  date: string;
  category: string;
  categoryId?: string | null;
  subcategory: string | null;
  subcategoryId?: string | null;
  note: string;
  type: Transaction["type"];
  fixed?: boolean | null;
  amount: number;
  fundId?: string | null;
  fundedBy?: string | null;
  splitLabel?: string | null;
  raw?: Transaction;
}

export function mergeSplitDisplay(monthTx: Transaction[], funds: FundWithBalance[]): DisplayTransactionItem[] {
  const seen = new Set<string>();
  const items: DisplayTransactionItem[] = [];
  monthTx.forEach((t) => {
    if (seen.has(t.id)) return;
    if (t.splitId) {
      const group = monthTx.filter((g) => g.splitId === t.splitId);
      group.forEach((g) => seen.add(g.id));
      const total = group.reduce((s, g) => s + g.amount, 0);
      const fundedPart = group.find((g) => g.fundedBy);
      const fund = fundedPart ? funds.find((f) => f.id === fundedPart.fundedBy) : null;
      items.push({
        ids: group.map((g) => g.id),
        date: t.date,
        category: t.category,
        categoryId: t.categoryId,
        subcategory: t.subcategory,
        subcategoryId: t.subcategoryId,
        note: t.note,
        type: "gasto",
        fixed: t.fixed,
        amount: total,
        splitLabel: fund ? `parte pagada con ahorro (${fund.name}: ${fmt(fundedPart!.amount)})` : null,
      });
    } else {
      seen.add(t.id);
      items.push({
        ids: [t.id],
        date: t.date,
        category: t.category,
        categoryId: t.categoryId,
        subcategory: t.subcategory,
        subcategoryId: t.subcategoryId,
        note: t.note,
        type: t.type,
        fixed: t.fixed,
        amount: t.amount,
        fundId: t.fundId,
        fundedBy: t.fundedBy,
        raw: t,
      });
    }
  });
  return items;
}
