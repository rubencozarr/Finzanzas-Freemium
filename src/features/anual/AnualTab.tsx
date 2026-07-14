import { useMemo } from "react";
import { ChevronLeft, ChevronRight, PiggyBank } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { CategoryOverviewDonut, type DonutDatum } from "../../components/CategoryOverviewDonut";
import { ChartsSection } from "../../components/ChartsSection";
import { PremiumGate } from "../../components/PremiumGate";
import { YearComparisonCards } from "../../components/YearComparisonCards";
import {
  buildAssetYearBreakdown,
  buildYearComparison,
  yearTotalsThroughMonth,
  type YearMonthData,
  type YearTotals,
} from "../../lib/calculations";
import { MONTHS_FULL } from "../../lib/constants";
import { fmt } from "../../lib/format";
import type { Asset, Transaction } from "../../types";

interface AnualTabProps {
  isPremium: boolean;
  year: number;
  changeYear: (delta: number) => void;
  data: YearMonthData[];
  totals: YearTotals;
  transactions: Transaction[];
  assets: Asset[];
  variableBudget: number;
  compareYear: number | null;
  onCompareYearChange: (year: number | null) => void;
}

export function AnualTab({
  isPremium,
  year,
  changeYear,
  data,
  totals,
  transactions,
  assets,
  variableBudget,
  compareYear,
  onCompareYearChange,
}: AnualTabProps) {
  const overviewDataAnual: DonutDatum[] = [
    { name: "Gasto fijo", value: totals.fixedOrdinario, color: "#94a3b8" },
    { name: "Gasto variable", value: totals.variableOrdinario, color: "#fb7185" },
    { name: "Inversión", value: totals.inversion, color: "#818cf8" },
    { name: "Uso de ahorro", value: totals.gastosFinanciados, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  // Año completo del año comparado (no restringido a los mismos meses transcurridos: un donut muestra
  // proporciones, no importes acumulados, así que no hace falta la comparación "mismos meses" que sí
  // necesitan las tarjetas de arriba).
  const compareYearTotals = useMemo(
    () => (compareYear ? yearTotalsThroughMonth(transactions, compareYear, 11) : null),
    [transactions, compareYear],
  );
  const compareOverviewData: DonutDatum[] = compareYearTotals
    ? [
        { name: "Gasto fijo", value: compareYearTotals.fixedOrdinario, color: "#94a3b8" },
        { name: "Gasto variable", value: compareYearTotals.variableOrdinario, color: "#fb7185" },
        { name: "Inversión", value: compareYearTotals.inversion, color: "#818cf8" },
        { name: "Uso de ahorro", value: compareYearTotals.gastosFinanciados, color: "#f59e0b" },
      ].filter((d) => d.value > 0)
    : [];

  const assetYearBreakdown = useMemo(
    () => (isPremium ? buildAssetYearBreakdown(transactions, assets, year) : []),
    [isPremium, transactions, assets, year],
  );
  const compareAssetYearBreakdown = useMemo(
    () => (isPremium && compareYear ? buildAssetYearBreakdown(transactions, assets, compareYear) : []),
    [isPremium, compareYear, transactions, assets],
  );

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map((t) => Number(t.date.slice(0, 4))));
    years.delete(year);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, year]);

  // Cuántos meses de `year` comparar: los 12 si ya es un año cerrado, o hasta el mes real de hoy si es
  // el año en curso (así "enero-julio 2026" se compara con "enero-julio 2025", no con el año entero).
  const today = new Date();
  const cutoffMonthIdx = year < today.getFullYear() ? 11 : year > today.getFullYear() ? -1 : today.getMonth();
  const monthsLabel = cutoffMonthIdx >= 11 ? "todo el año" : `${MONTHS_FULL[0]}-${MONTHS_FULL[cutoffMonthIdx]}`;

  const comparisonTotals = useMemo(() => {
    if (!compareYear || cutoffMonthIdx < 0) return null;
    return {
      current: yearTotalsThroughMonth(transactions, year, cutoffMonthIdx),
      compare: yearTotalsThroughMonth(transactions, compareYear, cutoffMonthIdx),
    };
  }, [transactions, year, compareYear, cutoffMonthIdx]);

  const comparisonChartData = useMemo(
    () => (compareYear ? buildYearComparison(transactions, year, compareYear) : null),
    [transactions, year, compareYear],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => changeYear(-1)} className="p-1.5 rounded-full hover:bg-stone-200 text-slate-600">
          <ChevronLeft size={18} />
        </button>
        <span className="font-serif text-base">{year}</span>
        <button onClick={() => changeYear(1)} className="p-1.5 rounded-full hover:bg-stone-200 text-slate-600">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatCard label="Ingresos año" value={totals.ingresos} tone="emerald" />
        <StatCard label="Gastos año" value={totals.gastos} tone="rose" />
        <div className="col-span-2 rounded-lg px-3 py-2.5 bg-teal-50">
          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <PiggyBank size={13} /> Tu ahorro
          </p>
          <p className="text-xs text-stone-500 mb-0.5">Ahorro libre generado este año</p>
          <p className="font-mono text-lg text-teal-800">{fmt(totals.ahorroReal)}</p>
        </div>
        <StatCard label="Invertido este año" value={totals.inversion} tone="indigo" />
      </div>
      <p className="text-xs text-stone-400 -mt-2 mb-4">
        Estos datos son solo de {year}, comparables entre años. Tu posición patrimonial acumulada (cuánto tienes en total) la ves en Fondos e
        inversión.
      </p>

      {isPremium ? (
        <>
          {availableYears.length > 0 && (
            <div className="mb-4">
              <label className="text-xs text-stone-500 mb-1.5 block">Comparar con</label>
              <select
                value={compareYear ?? ""}
                onChange={(e) => onCompareYearChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-base bg-white"
              >
                <option value="">Sin comparar</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {compareYear && comparisonTotals && (
                <YearComparisonCards
                  year={year}
                  compareYear={compareYear}
                  current={comparisonTotals.current}
                  compare={comparisonTotals.compare}
                  monthsLabel={monthsLabel}
                />
              )}
            </div>
          )}

          {compareYear ? (
            <>
              <CategoryOverviewDonut data={overviewDataAnual} title={`De dónde ha salido tu dinero — ${year}`} ingresos={totals.ingresos} />
              {compareYearTotals && (
                <CategoryOverviewDonut
                  data={compareOverviewData}
                  title={`De dónde ha salido tu dinero — ${compareYear}`}
                  ingresos={compareYearTotals.ingresos}
                />
              )}
            </>
          ) : (
            <CategoryOverviewDonut data={overviewDataAnual} title="De dónde ha salido tu dinero este año" ingresos={totals.ingresos} />
          )}

          <ChartsSection
            data={data}
            variableBudget={variableBudget}
            assetBreakdown={assetYearBreakdown}
            totalInversion={totals.inversion}
            year={year}
            compareYear={compareYear}
            compareData={comparisonChartData}
            compareAssetBreakdown={compareAssetYearBreakdown}
            compareTotalInversion={compareYearTotals?.inversion ?? 0}
          />
        </>
      ) : (
        <PremiumGate message="Desbloquea los gráficos anuales, el desglose por categorías y la comparativa entre años con Premium" />
      )}
    </div>
  );
}
