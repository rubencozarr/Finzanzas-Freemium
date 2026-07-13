import { useMemo } from "react";
import { ChevronLeft, ChevronRight, PiggyBank } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { CategoryOverviewDonut, type DonutDatum } from "../../components/CategoryOverviewDonut";
import { ChartsSection } from "../../components/ChartsSection";
import { buildAssetYearBreakdown, type YearMonthData, type YearTotals } from "../../lib/calculations";
import { fmt } from "../../lib/format";
import type { Asset, Transaction } from "../../types";

interface AnualTabProps {
  year: number;
  changeYear: (delta: number) => void;
  data: YearMonthData[];
  totals: YearTotals;
  transactions: Transaction[];
  assets: Asset[];
  variableBudget: number;
}

export function AnualTab({ year, changeYear, data, totals, transactions, assets, variableBudget }: AnualTabProps) {
  const overviewDataAnual: DonutDatum[] = [
    { name: "Gasto fijo", value: totals.fixedOrdinario, color: "#94a3b8" },
    { name: "Gasto variable", value: totals.variableOrdinario, color: "#fb7185" },
    { name: "Inversión", value: totals.inversion, color: "#818cf8" },
    { name: "Uso de ahorro", value: totals.gastosFinanciados, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const assetYearBreakdown = useMemo(() => buildAssetYearBreakdown(transactions, assets, year), [transactions, assets, year]);

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

      <CategoryOverviewDonut data={overviewDataAnual} title="De dónde ha salido tu dinero este año" ingresos={totals.ingresos} />

      <ChartsSection data={data} variableBudget={variableBudget} assetBreakdown={assetYearBreakdown} totalInversion={totals.inversion} />
    </div>
  );
}
