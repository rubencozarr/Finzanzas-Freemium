import { usePersistentState } from "../lib/persistentState";
import { GroupHeader } from "./GroupHeader";
import { IncomeSourceBreakdownList, type IncomeSourceSubgroup } from "./IncomeSourceBreakdownList";

interface IncomeSourceGroupProps {
  total: number;
  subgroups: IncomeSourceSubgroup[];
}

/** Bloque plegable "Ingresos" de Mensual: importe por fuente agrupado en subgrupos (fijos/extra/otros,
 * decididos por MensualTab), con "Sin clasificar" al final de cada subgrupo si lo hay (ver
 * buildIncomeBySource en calculations.ts). Solo se muestra el % de cada fuente sobre el total de
 * ingresos del mes, sin más porcentajes (a diferencia de CategoryGroup, que también compara contra
 * presupuestos). El propio llamador decide si montar este componente según si hay algo clasificado que
 * mostrar, y qué subgrupos pasar (uno con total 0 no debe incluirse). */
export function IncomeSourceGroup({ total, subgroups }: IncomeSourceGroupProps) {
  const [expanded, setExpanded] = usePersistentState("mensual.incomeSourceGroup", false);
  return (
    <div className="mb-5">
      <GroupHeader title="Ingresos" total={total} tone="ingreso" expanded={expanded} onToggle={() => setExpanded((e) => !e)} />
      {expanded && <IncomeSourceBreakdownList total={total} subgroups={subgroups} />}
    </div>
  );
}
