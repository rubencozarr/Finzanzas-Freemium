import { fmt } from "../lib/format";
import { usePersistentState } from "../lib/persistentState";
import { GroupHeader } from "./GroupHeader";
import type { IncomeSourceBreakdown } from "../lib/calculations";

interface IncomeSourceGroupProps {
  total: number;
  sources: IncomeSourceBreakdown[];
}

/** Bloque plegable "Ingresos" de Mensual: importe por fuente, ya ordenado de mayor a menor con "Sin
 * clasificar" al final (ver buildIncomeBySource en calculations.ts). Solo se muestra el % de cada
 * fuente sobre el total de ingresos del mes, sin más porcentajes (a diferencia de CategoryGroup, que
 * también compara contra presupuestos). El propio llamador (MensualTab) decide si montar este
 * componente según si hay algo clasificado que mostrar. */
export function IncomeSourceGroup({ total, sources }: IncomeSourceGroupProps) {
  const [expanded, setExpanded] = usePersistentState("mensual.incomeSourceGroup", false);
  return (
    <div className="mb-5">
      <GroupHeader title="Ingresos" total={total} tone="ingreso" expanded={expanded} onToggle={() => setExpanded((e) => !e)} />
      {expanded && (
        <div className="space-y-1.5">
          {sources.map((s) => (
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
      )}
    </div>
  );
}
