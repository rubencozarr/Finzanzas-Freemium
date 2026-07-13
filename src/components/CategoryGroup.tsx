import { useState } from "react";
import { fmt } from "../lib/format";
import { CategoryCard } from "./CategoryCard";
import { CategoryOverviewDonut, type DonutDatum } from "./CategoryOverviewDonut";
import { GroupHeader, type GroupTone } from "./GroupHeader";
import type { CategoryBreakdown } from "../lib/calculations";

interface CategoryGroupProps {
  title: string;
  total: number;
  pct: number;
  cats: CategoryBreakdown[];
  tone: GroupTone;
  showPct?: boolean;
  budget?: number;
}

const VARIABLE_PALETTE = ["#fb7185", "#f97373", "#fda4af", "#e11d48", "#f43f5e", "#9f1239", "#be123c", "#fecdd3"];

export function CategoryGroup({ title, total, pct, cats, tone, showPct, budget = 0 }: CategoryGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const hasBudget = budget > 0;
  const budgetPct = hasBudget ? (total / budget) * 100 : 0;
  const overBudget = hasBudget && total > budget;
  const isEmpty = total === 0;
  const isVariable = tone === "variable";

  const compositionData: DonutDatum[] =
    isVariable && cats.length >= 3
      ? cats.map((c, i) => ({ name: c.name, value: c.total, color: VARIABLE_PALETTE[i % VARIABLE_PALETTE.length] }))
      : [];

  return (
    <div className={`mb-5 ${isEmpty ? "opacity-40" : ""}`}>
      <GroupHeader
        title={title}
        total={total}
        tone={tone}
        extra={showPct ? `${pct.toFixed(0)}% de tus ingresos` : null}
        expanded={expanded}
        onToggle={() => !isEmpty && setExpanded((e) => !e)}
      />
      {hasBudget && !isEmpty && (
        <p className={`text-xs -mt-1 mb-2 ${overBudget ? "text-rose-600 font-medium" : "text-stone-400"}`}>
          {overBudget
            ? `Presupuesto total de variable superado en ${fmt(total - budget)}`
            : `${budgetPct.toFixed(0)}% de tu presupuesto total de variable (${fmt(budget)})`}
        </p>
      )}
      {expanded &&
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
                pct={showPct ? (total ? (c.total / total) * pct : 0) : null}
                pctOfVariable={isVariable ? (total ? (c.total / total) * 100 : 0) : null}
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
