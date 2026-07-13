import type { YearMonthData } from "../lib/calculations";

interface BudgetComplianceChartProps {
  data: YearMonthData[];
  variableBudget: number;
}

export function BudgetComplianceChart({ data, variableBudget }: BudgetComplianceChartProps) {
  if (!(variableBudget > 0)) {
    return (
      <p className="text-xs text-stone-400 bg-white rounded-lg border border-stone-100 p-3">
        Configura un presupuesto total de gasto variable en Ajustes → Categorías para activar este gráfico.
      </p>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-stone-100 p-3">
      <div className="grid grid-cols-12 gap-1">
        {data.map((m) => {
          const noData = m.ingresos === 0 && m.variableOrdinario === 0;
          const over = m.variableOrdinario > variableBudget;
          return (
            <div key={m.mes} className="flex flex-col items-center gap-1">
              <div className={`w-full aspect-square rounded ${noData ? "bg-stone-100" : over ? "bg-rose-500" : "bg-emerald-500"}`} />
              <span className="text-[9px] text-stone-400">{m.mes}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-emerald-500" />
          Dentro del presupuesto
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-rose-500" />
          Superado
        </span>
      </div>
    </div>
  );
}
