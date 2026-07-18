import { useMemo } from "react";
import { PiggyBank, Settings2 } from "lucide-react";
import { MonthSwitcher } from "../../components/MonthSwitcher";
import { CategoryOverviewDonut, type DonutDatum } from "../../components/CategoryOverviewDonut";
import { CategoryGroup } from "../../components/CategoryGroup";
import { FundUsageGroup } from "../../components/FundUsageGroup";
import { SparklineTrend } from "../../components/SparklineTrend";
import { MonthlyInsights } from "../../components/MonthlyInsights";
import { Row } from "../../components/Row";
import { buildAssetBreakdown, buildBreakdown, buildFundUsage, buildMonthlyInsights, type MonthStats, type TrendPoint } from "../../lib/calculations";
import { fmt } from "../../lib/format";
import type { Asset, Category, FundWithBalance, Transaction } from "../../types";

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
  transactions: Transaction[];
  variableBudget: number;
  trend6Meses: TrendPoint[];
  onGoToAjustes: () => void;
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
  transactions,
  variableBudget,
  trend6Meses,
  onGoToAjustes,
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
  const fundUsage = useMemo(() => buildFundUsage(monthTx, transactions, funds), [monthTx, transactions, funds]);
  const assetCats = useMemo(() => buildAssetBreakdown(monthTx, assets), [monthTx, assets]);
  const insights = useMemo(
    () => buildMonthlyInsights(transactions, categories, year, monthIdx, isPremium),
    [transactions, categories, year, monthIdx, isPremium],
  );

  const pctFijo = stats.ingresos ? (stats.fixedOrdinario / stats.ingresos) * 100 : 0;
  const pctVariable = stats.ingresos ? (stats.variableOrdinario / stats.ingresos) * 100 : 0;
  const pctInversion = stats.ingresos ? (stats.inversion / stats.ingresos) * 100 : 0;
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
        onGoToAjustes={onGoToAjustes}
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
        <button onClick={onGoToAjustes} className="text-stone-400 hover:text-slate-700">
          <Settings2 size={16} />
        </button>
      </div>

      <CategoryGroup title="Gasto fijo" total={stats.fixedOrdinario} pct={pctFijo} cats={fixedCats} tone="fixed" showPct />
      <CategoryGroup
        title="Gasto variable"
        total={stats.variableOrdinario}
        pct={pctVariable}
        cats={variableCats}
        tone="variable"
        showPct
        budget={variableBudget}
      />
      <CategoryGroup
        title="Inversión"
        total={stats.inversion}
        pct={pctInversion}
        cats={isPremium ? assetCats : []}
        tone="inversion"
        showPct
        hideDetail={!isPremium}
      />
      <FundUsageGroup total={stats.gastosFinanciados} funds={fundUsage} />

      <SparklineTrend data={trend6Meses} isPremium={isPremium} />
    </div>
  );
}
