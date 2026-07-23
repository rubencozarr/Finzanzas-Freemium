import { fmt } from "../lib/format";
import { usePersistentState } from "../lib/persistentState";
import { CategoryCard } from "./CategoryCard";
import { CategoryOverviewDonut, type DonutDatum } from "./CategoryOverviewDonut";
import { GroupHeader, type GroupTone } from "./GroupHeader";
import type { CategoryBreakdown } from "../lib/calculations";

interface CategoryGroupProps {
  title: string;
  total: number;
  cats: CategoryBreakdown[];
  tone: GroupTone;
  budget?: number;
  /** Cabecera informativa sin desglose: ni chevron ni expandir, solo el total. Para bloques cuyo
   * detalle por elemento individual no debe verse (p. ej. inversión por activo en free). */
  hideDetail?: boolean;
}

// Etiqueta del % de cada categoría sobre el total de su bloque (CategoryCard). Sin entrada (variable)
// ese % se sigue calculando para dimensionar la barra, pero no se muestra como texto: ya se ve en el
// donut de composición del variable.
const BLOCK_PCT_LABEL: Partial<Record<GroupTone, string>> = {
  fixed: "de gastos fijos",
  inversion: "de inversión",
};

// Paleta cualitativa (base Tableau10): tonos claramente distintos entre sí en vez de varios matices de
// un mismo color, para que las categorías se distingan bien también con daltonismo.
const VARIABLE_PALETTE = [
  "#4E79A7", // azul
  "#F28E2B", // naranja
  "#E15759", // rojo
  "#59A14F", // verde
  "#EDC948", // amarillo
  "#B07AA1", // púrpura
  "#FF9DA7", // rosa
  "#9C755F", // marrón
  "#BAB0AC", // gris
  "#D37295", // malva
];

export function CategoryGroup({ title, total, cats, tone, budget = 0, hideDetail }: CategoryGroupProps) {
  const [expanded, setExpanded] = usePersistentState(`mensual.categoryGroup.${tone}`, false);
  const hasBudget = budget > 0;
  const budgetPct = hasBudget ? (total / budget) * 100 : 0;
  const overBudget = hasBudget && total > budget;
  const isEmpty = total === 0;
  const isVariable = tone === "variable";
  const blockPctLabel = BLOCK_PCT_LABEL[tone];

  const compositionData: DonutDatum[] =
    isVariable && cats.length >= 2
      ? cats.map((c, i) => ({ name: c.name, value: c.total, color: VARIABLE_PALETTE[i % VARIABLE_PALETTE.length] }))
      : [];

  return (
    <div className={`mb-5 ${isEmpty ? "opacity-40" : ""}`}>
      <GroupHeader
        title={title}
        total={total}
        tone={tone}
        expanded={expanded}
        onToggle={() => !isEmpty && setExpanded((e) => !e)}
        interactive={!hideDetail}
      />
      {hasBudget && !isEmpty && (
        <p className={`text-xs -mt-1 mb-2 ${overBudget ? "text-rose-600 font-medium" : "text-stone-400"}`}>
          {overBudget
            ? `Presupuesto total de variable superado en ${fmt(total - budget)}`
            : `${budgetPct.toFixed(0)}% de tu presupuesto total de variable (${fmt(budget)})`}
        </p>
      )}
      {!hideDetail &&
        expanded &&
        (cats.length === 0 ? (
          <p className="text-stone-400 text-xs mb-2">Sin movimientos en este bloque.</p>
        ) : (
          <>
            {compositionData.length > 0 && (
              <CategoryOverviewDonut data={compositionData} title="Composición del gasto variable" ingresos={0} />
            )}
            {cats.map((c) => (
              <CategoryCard
                key={c.name}
                name={c.name}
                total={c.total}
                blockPct={total ? (c.total / total) * 100 : 0}
                blockPctLabel={blockPctLabel}
                subcats={c.subcats}
                sinClasificar={c.sinClasificar}
                tone={tone}
                budget={c.budget}
              />
            ))}
          </>
        ))}
    </div>
  );
}
