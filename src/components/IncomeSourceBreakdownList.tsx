import { fmt } from "../lib/format";
import type { IncomeSourceBreakdown } from "../lib/calculations";

export interface IncomeSourceSubgroup {
  label: string;
  total: number;
  sources: IncomeSourceBreakdown[];
}

interface IncomeSourceBreakdownListProps {
  // Base del % de cada fuente — el total de ingresos del mes/año, NUNCA el subtotal del subgrupo (así
  // "Nómina" dentro de "Ingresos fijos" se lee en relación a todo lo que ingresaste, no solo a lo fijo).
  total: number;
  subgroups: IncomeSourceSubgroup[];
}

/** Lista de fuentes agrupadas en subgrupos (fijos/extra/otros), compartida entre el bloque plegable de
 * Mensual (IncomeSourceGroup) y el gráfico "Ingresos por fuente" de Anual (ChartsSection), para que el
 * formato sea idéntico en los dos sitios. El llamador decide qué subgrupos pasar y en qué orden; un
 * subgrupo con total 0 no debe incluirse (se filtra antes de llegar aquí, no dentro de este componente). */
export function IncomeSourceBreakdownList({ total, subgroups }: IncomeSourceBreakdownListProps) {
  return (
    <div className="space-y-3">
      {subgroups.map((g) => (
        <div key={g.label}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">{g.label}</span>
            <span className="font-mono text-sm font-medium">{fmt(g.total)}</span>
          </div>
          <div className="space-y-1.5">
            {g.sources.map((s) => (
              <div
                key={s.id ?? s.name}
                className="flex justify-between items-center bg-white border border-stone-100 rounded-lg px-3 py-2 text-sm"
              >
                <span className={s.id === null ? "text-stone-500" : ""}>{s.name}</span>
                <span className="font-mono">
                  {fmt(s.total)}
                  <span className="text-stone-500"> · {total ? ((s.total / total) * 100).toFixed(0) : 0}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
