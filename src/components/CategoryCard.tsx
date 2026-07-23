import { ChevronDown, ChevronUp } from "lucide-react";
import { fmt } from "../lib/format";
import { usePersistentState } from "../lib/persistentState";
import type { GroupTone } from "./GroupHeader";

interface CategoryCardProps {
  name: string;
  total: number;
  /** % que representa esta categoría sobre el total de su bloque (fijo/variable/inversión). */
  blockPct: number | null;
  /** Etiqueta para mostrar blockPct como texto ("de gastos fijos", "de inversión"). Sin etiqueta
   * (variable) se sigue calculando blockPct para dimensionar la barra, pero no se muestra como texto:
   * ese dato ya se ve en el donut de composición del variable. */
  blockPctLabel?: string;
  subcats: { name: string; total: number }[];
  sinClasificar: number;
  tone: GroupTone;
  budget: number;
}

const ACCENT: Record<GroupTone, string> = {
  fixed: "border-slate-400",
  variable: "border-rose-400",
  inversion: "border-indigo-400",
  ahorro: "border-amber-400",
  fondos: "border-teal-400",
};
const BAR: Record<GroupTone, string> = {
  fixed: "bg-slate-400",
  variable: "bg-rose-400",
  inversion: "bg-indigo-400",
  ahorro: "bg-amber-400",
  fondos: "bg-teal-400",
};
const SUB_BAR: Record<GroupTone, string> = {
  fixed: "bg-slate-200",
  variable: "bg-rose-200",
  inversion: "bg-indigo-200",
  ahorro: "bg-amber-200",
  fondos: "bg-teal-200",
};

export function CategoryCard({ name, total, blockPct, blockPctLabel, subcats, sinClasificar, tone, budget }: CategoryCardProps) {
  const [expanded, setExpanded] = usePersistentState(`mensual.categoryCard.${tone}.${name}`, false);

  const hasBudget = budget > 0;
  const budgetPct = hasBudget ? (total / budget) * 100 : 0;
  const overBudget = hasBudget && total > budget;
  const budgetBarColor = overBudget ? "bg-rose-500" : budgetPct >= 80 ? "bg-amber-500" : "bg-emerald-500";
  const showBlockPctText = blockPctLabel != null && blockPct != null;
  const hasDetail = subcats.length > 0 || sinClasificar > 0 || hasBudget;

  const amountLabel = hasBudget ? `${fmt(total)} / ${fmt(budget)}` : fmt(total);

  return (
    <div className={`border-l-4 ${ACCENT[tone]} border-y border-r border-stone-100 bg-white rounded-r-lg mb-2 overflow-hidden`}>
      <button onClick={() => hasDetail && setExpanded((e) => !e)} className={`w-full text-left pl-3 pr-3 py-2.5 ${hasDetail ? "" : "cursor-default"}`}>
        <div className="flex justify-between items-center gap-2 text-sm mb-1">
          <span className="font-medium flex items-center gap-1.5 min-w-0 truncate">
            {name}
            {overBudget && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-xs">{amountLabel}</span>
            {hasDetail && (expanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />)}
          </span>
        </div>
        {showBlockPctText && (
          <p className="text-right text-[11px] text-stone-400 mb-1">
            {blockPct!.toFixed(0)}% {blockPctLabel}
          </p>
        )}
        {(hasBudget || blockPct != null) && (
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${hasBudget ? budgetBarColor : BAR[tone]}`}
              style={{ width: `${Math.min(100, hasBudget ? budgetPct : blockPct ?? 0)}%` }}
            />
          </div>
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-2.5">
          {overBudget && <p className="text-xs mb-2 text-rose-600 font-medium">Presupuesto superado en {fmt(total - budget)}</p>}
          {subcats.length > 0 && (
            <div className="border-l-2 border-stone-100 ml-1 pl-3 space-y-1.5">
              {subcats.map((sc) => {
                const scPct = total ? (sc.total / total) * 100 : 0;
                return (
                  <div key={sc.name}>
                    <div className="flex justify-between text-xs text-stone-500">
                      <span>{sc.name}</span>
                      <span className="font-mono">
                        {fmt(sc.total)} · {scPct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full ${SUB_BAR[tone]}`} style={{ width: `${Math.min(100, scPct)}%` }} />
                    </div>
                  </div>
                );
              })}
              {sinClasificar > 0 && (
                <div className="flex justify-between text-xs text-stone-400">
                  <span>Sin subcategoría</span>
                  <span className="font-mono">{fmt(sinClasificar)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
