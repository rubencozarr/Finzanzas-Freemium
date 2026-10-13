import { useMemo } from "react";
import { PiggyBank, Settings2 } from "lucide-react";
import { MonthSwitcher } from "../../components/MonthSwitcher";
import { CategoryOverviewDonut, type DonutDatum } from "../../components/CategoryOverviewDonut";
import { CategoryGroup } from "../../components/CategoryGroup";
import { FundUsageGroup } from "../../components/FundUsageGroup";
import { IncomeSourceGroup } from "../../components/IncomeSourceGroup";
import { SparklineTrend } from "../../components/SparklineTrend";
import { MonthlyInsights } from "../../components/MonthlyInsights";
import { Row } from "../../components/Row";
import {
  buildAssetBreakdown,
  buildBreakdown,
  buildFundUsage,
  buildIncomeBySource,
  buildMonthlyInsights,
  type MonthStats,
  type TrendPoint,
} from "../../lib/calculations";
import { fmt } from "../../lib/format";
import { INCOME_CATS } from "../../lib/constants";
import type { Asset, Category, FundWithBalance, IncomeSource, Transaction } from "../../types";

interface MensualTabProps {
  isPremium: boolean;
  canNavigateToMonth: (monthDate: Date) => boolean;
  monthIdx: number;
  year: number;
  changeMonth: (delta: number) => void;
  changeYear: (delta: number) => void;
  goToMonthIndex: (m: number) => void;
  getAhorroReal: (year: number, monthIdx: number) => number;
  stats: MonthStats;
  monthTx: Transaction[];
  categories: Category[];
  funds: FundWithBalance[];
  assets: Asset[];
  incomeSources: IncomeSource[];
  transactions: Transaction[];
  variableBudget: number;
  trend6Meses: TrendPoint[];
  onGoToAjustes: () => void;
  onOpenPremiumScreen: () => void;
}

export function MensualTab({
  isPremium,
  canNavigateToMonth,
  monthIdx,
  year,
  changeMonth,
  changeYear,
  goToMonthIndex,
  getAhorroReal,
  stats,
  monthTx,
  categories,
  funds,
  assets,
  incomeSources,
  transactions,
  variableBudget,
  trend6Meses,
  onGoToAjustes,
  onOpenPremiumScreen,
}: MensualTabProps) {
  // En free, las subcategorías y el presupuesto por categoría son premium-only desde el Bloque 1
  // (Ajustes), así que un usuario free nuevo nunca los tendrá; esto es refuerzo defensivo por si
  // quedan de datos importados o un downgrade (solo se muestra el presupuesto global de variable).
  const stripPremiumOnly = (b: ReturnType<typeof buildBreakdown>) =>
    isPremium ? b : b.map((c) => ({ ...c, subcats: [], sinClasificar: 0, budget: 0 }));
  const fixedCats = useMemo(
    () => stripPremiumOnly(buildBreakdown(monthTx, categories, "fixedOrdinario")),
    [monthTx, categories, isPremium],
  );
  const variableCats = useMemo(
    () => stripPremiumOnly(buildBreakdown(monthTx, categories, "variableOrdinario")),
    [monthTx, categories, isPremium],
  );
  const mKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  // Tres subgrupos por el campo que ya distingue fijo/extra en el ingreso (t.category): "Otros ingresos"
  // es un cajón de respaldo para cualquier valor que no sea exactamente uno de los dos de INCOME_CATS
  // (no debería pasar con datos creados desde la app, pero así fijos + extra + otros siempre suma
  // exactamente stats.ingresos sin dejar ningún ingreso del mes fuera de los tres subgrupos). Una misma
  // fuente puede aparecer repetida en varios subgrupos si se usó tanto en un ingreso fijo como en uno
  // extra ese mes: cada subgrupo se calcula sobre su propio subconjunto de movimientos, de forma
  // independiente. El % de cada fuente se calcula sobre stats.ingresos (el total del mes completo), no
  // sobre el subtotal de su subgrupo — por eso IncomeSourceBreakdownList recibe `total` por separado.
  const incomeSubgroups = useMemo(() => {
    const monthIncome = monthTx.filter((t) => t.type === "ingreso");
    const groups = [
      { label: "Ingresos fijos", tx: monthIncome.filter((t) => t.category === INCOME_CATS[0]) },
      { label: "Ingresos extra", tx: monthIncome.filter((t) => t.category === INCOME_CATS[1]) },
      { label: "Otros ingresos", tx: monthIncome.filter((t) => !(INCOME_CATS as readonly string[]).includes(t.category)) },
    ];
    return groups
      .map((g) => {
        const sources = buildIncomeBySource(g.tx, incomeSources, mKey);
        return { label: g.label, total: sources.reduce((s, b) => s + b.total, 0), sources };
      })
      .filter((g) => g.total > 0);
  }, [monthTx, incomeSources, mKey]);
  // Si ningún ingreso del mes tiene fuente asignada (ni viva ni de una ya borrada), el bloque no se
  // renderiza — mostrar "Ingresos" con un único "Sin clasificar" no aportaría nada. Distinto de mirar
  // incomeSubgroups directamente: ahí un grupo con id null puede ser una fuente borrada (sí cuenta como
  // clasificado) o el cajón "Sin clasificar" (no cuenta), así que se comprueba sobre los movimientos.
  const hasAnyClassifiedIncome = monthTx.some((t) => t.type === "ingreso" && (t.incomeSourceId || t.incomeSourceName));
  const fundUsage = useMemo(() => {
    const usage = buildFundUsage(monthTx, transactions, funds, mKey);
    // Mismo criterio que stripPremiumOnly de arriba: subcategorías son premium-only.
    return isPremium ? usage : usage.map((f) => ({ ...f, cats: f.cats.map((c) => ({ ...c, subcats: [] })) }));
  }, [monthTx, transactions, funds, mKey, isPremium]);
  const assetCats = useMemo(() => buildAssetBreakdown(monthTx, assets), [monthTx, assets]);
  const insights = useMemo(
    () => buildMonthlyInsights(transactions, categories, year, monthIdx, isPremium),
    [transactions, categories, year, monthIdx, isPremium],
  );

  const gastosTotales = stats.fixedOrdinario + stats.variableOrdinario + stats.inversion;
  const pctGastosTotales = stats.ingresos ? (gastosTotales / stats.ingresos) * 100 : 0;

  const overviewData: DonutDatum[] = [
    { name: "Gasto fijo", value: stats.fixedOrdinario, color: "#94a3b8" },
    { name: "Gasto variable", value: stats.variableOrdinario, color: "#fb7185" },
    { name: "Inversión", value: stats.inversion, color: "#818cf8" },
    { name: "Uso de ahorro", value: stats.gastosFinanciados, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <MonthSwitcher
        isPremium={isPremium}
        canNavigateToMonth={canNavigateToMonth}
        monthIdx={monthIdx}
        year={year}
        changeMonth={changeMonth}
        changeYear={changeYear}
        goToMonthIndex={goToMonthIndex}
        getAhorroReal={getAhorroReal}
        onOpenPremiumScreen={onOpenPremiumScreen}
      />
      <div className="bg-white rounded-lg border border-stone-100 p-4 mb-5 space-y-2 text-sm">
        <Row label="Ingresos" value={stats.ingresos} bold tone="emerald" />
        <Row label="Gastos totales" value={-gastosTotales} pctText={`${pctGastosTotales.toFixed(0)}% de ingresos`} bold />
        {stats.aportaciones > 0 && <Row label="Aportaciones a fondos" value={-stats.aportaciones} />}
        <div className="border-t border-stone-100 pt-3 mt-2 -mx-4 px-4 pb-3 bg-teal-50 rounded-b-lg">
          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <PiggyBank size={13} /> Tu ahorro
          </p>
          <p className="text-xs text-stone-500 mb-0.5">Ahorro libre en curso este mes</p>
          <p className="font-mono text-lg text-teal-800">{fmt(stats.ahorroReal)}</p>
          <p className="text-xs text-stone-500 mt-1">
            Lo que te ha sobrado este mes, sin contar fondos ni inversión. Al cerrar el mes, se sumará a tu ahorro libre consolidado.
          </p>
        </div>
      </div>

      <CategoryOverviewDonut data={overviewData} title="De dónde ha salido tu dinero este mes" ingresos={stats.ingresos} />

      <MonthlyInsights insights={insights} isPremium={isPremium} />

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-stone-500">Desglose por categoría</p>
        <button
          onClick={onGoToAjustes}
          className="min-w-[44px] min-h-[44px] -m-3 flex items-center justify-center text-stone-500 hover:text-slate-700"
          aria-label="Ir a Ajustes de categorías"
        >
          <Settings2 size={16} />
        </button>
      </div>

      {hasAnyClassifiedIncome && <IncomeSourceGroup total={stats.ingresos} subgroups={incomeSubgroups} />}
      <CategoryGroup title="Gasto fijo" total={stats.fixedOrdinario} cats={fixedCats} tone="fixed" />
      <CategoryGroup title="Gasto variable" total={stats.variableOrdinario} cats={variableCats} tone="variable" budget={variableBudget} />
      <CategoryGroup title="Inversión" total={stats.inversion} cats={isPremium ? assetCats : []} tone="inversion" hideDetail={!isPremium} />
      <FundUsageGroup total={stats.gastosFinanciados} funds={fundUsage} />

      <SparklineTrend data={trend6Meses} isPremium={isPremium} />
    </div>
  );
}
