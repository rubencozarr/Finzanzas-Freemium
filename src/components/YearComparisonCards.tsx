import { ArrowDown, ArrowUp } from "lucide-react";
import { fmt } from "../lib/format";
import type { YearTotals } from "../lib/calculations";

interface MetricDef {
  key: keyof Pick<YearTotals, "ingresos" | "gastos" | "ahorroReal" | "inversion">;
  label: string;
  // En Gastos, subir no es una buena noticia aunque el % sea positivo: el color se invierte respecto
  // a las demás métricas (donde subir sí es positivo).
  invertColor?: boolean;
}

const METRICS: MetricDef[] = [
  { key: "ingresos", label: "Ingresos" },
  { key: "gastos", label: "Gastos", invertColor: true },
  { key: "ahorroReal", label: "Ahorro libre" },
  { key: "inversion", label: "Invertido" },
];

interface YearComparisonCardsProps {
  year: number;
  compareYear: number;
  current: YearTotals;
  compare: YearTotals;
  monthsLabel: string;
}

export function YearComparisonCards({ year, compareYear, current, compare, monthsLabel }: YearComparisonCardsProps) {
  return (
    <div className="mb-5">
      <div className="space-y-2">
        {METRICS.map((m) => {
          const curVal = current[m.key];
          const cmpVal = compare[m.key];
          const pct = cmpVal !== 0 ? ((curVal - cmpVal) / cmpVal) * 100 : null;
          const isUp = pct != null && pct > 0;
          const isFlat = pct != null && Math.abs(pct) < 0.05;
          const good = m.invertColor ? !isUp : isUp;
          return (
            <div key={m.key} className="bg-white rounded-lg border border-stone-100 px-3 py-2.5">
              <p className="text-xs font-medium text-stone-600 mb-1">{m.label}</p>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-stone-500">{year}</span>
                <span className="font-mono">{fmt(curVal)}</span>
              </div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-stone-400">{compareYear}</span>
                <span className="font-mono text-stone-500">{fmt(cmpVal)}</span>
              </div>
              {pct != null &&
                (isFlat ? (
                  <p className="text-xs font-medium mt-1 text-right text-stone-400">Sin cambios</p>
                ) : (
                  <p className={`text-xs font-medium mt-1 flex items-center gap-1 justify-end ${good ? "text-emerald-700" : "text-rose-700"}`}>
                    {isUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {Math.abs(pct).toLocaleString("es-ES", { maximumFractionDigits: 1 })}%
                  </p>
                ))}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-stone-400 mt-2">Comparando {monthsLabel} de ambos años.</p>
    </div>
  );
}
