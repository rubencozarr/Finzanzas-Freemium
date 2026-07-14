import type { YearComparisonPoint, YearMonthData } from "../lib/calculations";

interface BudgetComplianceChartProps {
  data: YearMonthData[];
  variableBudget: number;
  year: number;
  compareYear?: number | null;
  compareData?: YearComparisonPoint[] | null;
}

function complianceCell(key: string, noData: boolean, over: boolean) {
  return <div key={key} className={`aspect-square rounded ${noData ? "bg-stone-100" : over ? "bg-rose-500" : "bg-emerald-500"}`} />;
}

export function BudgetComplianceChart({ data, variableBudget, year, compareYear, compareData }: BudgetComplianceChartProps) {
  if (!(variableBudget > 0)) {
    return (
      <p className="text-xs text-stone-400 bg-white rounded-lg border border-stone-100 p-3">
        Configura un presupuesto total de gasto variable en Ajustes → Categorías para activar este gráfico.
      </p>
    );
  }

  const comparing = !!(compareYear && compareData);

  return (
    <div className="bg-white rounded-lg border border-stone-100 p-3">
      {comparing ? (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-stone-400 w-8 shrink-0 text-right">{compareYear}</span>
            <div className="grid grid-cols-12 gap-1 flex-1">
              {compareData!.map((m, i) =>
                complianceCell(`cmp-${i}`, m.compareIngresos === 0 && m.compareVariableOrdinario === 0, m.compareVariableOrdinario > variableBudget),
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-stone-600 w-8 shrink-0 text-right">{year}</span>
            <div className="grid grid-cols-12 gap-1 flex-1">
              {data.map((m) => complianceCell(m.mes, m.ingresos === 0 && m.variableOrdinario === 0, m.variableOrdinario > variableBudget))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-8 shrink-0" />
            <div className="grid grid-cols-12 gap-1 flex-1">
              {data.map((m) => (
                <span key={m.mes} className="text-[9px] text-stone-400 text-center">
                  {m.mes}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
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
      )}
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
