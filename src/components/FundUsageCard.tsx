import { ChevronDown, ChevronUp } from "lucide-react";
import { fmt } from "../lib/format";
import { usePersistentState } from "../lib/persistentState";
import type { FundUsage } from "../lib/calculations";

export function FundUsageCard({ f }: { f: FundUsage }) {
  const [expanded, setExpanded] = usePersistentState(`mensual.fundUsageCard.${f.id}`, false);
  return (
    <div className="border-l-4 border-amber-400 border-y border-r border-stone-100 bg-white rounded-r-lg mb-2 overflow-hidden">
      <button onClick={() => setExpanded((e) => !e)} className="w-full text-left pl-3 pr-3 py-2.5">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="font-medium">{f.name}</span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-xs">
              {fmt(f.total)} · {f.pct.toFixed(0)}% del fondo
            </span>
            {expanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
          </span>
        </div>
        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, f.pct)}%` }} />
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-2.5">
          <p className="text-xs text-stone-400 mb-2">de {fmt(f.totalAportado)} ahorrados en total en este fondo</p>
          <div className="border-l-2 border-stone-100 ml-1 pl-3 space-y-1.5">
            {f.cats.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs text-stone-500">
                  <span>{c.name}</span>
                  <span className="font-mono">
                    {fmt(c.total)} · {c.pct.toFixed(0)}% del fondo
                  </span>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-200" style={{ width: `${Math.min(100, c.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
