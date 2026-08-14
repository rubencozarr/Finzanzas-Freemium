import { ChevronDown, ChevronUp } from "lucide-react";
import { fmt } from "../lib/format";
import { usePersistentState } from "../lib/persistentState";
import type { FundUsage } from "../lib/calculations";

export function FundUsageCard({ f }: { f: FundUsage }) {
  const [expanded, setExpanded] = usePersistentState(`mensual.fundUsageCard.${f.id}`, false);
  return (
    <div className="border-l-4 border-amber-400 border-y border-r border-stone-100 bg-white rounded-r-lg mb-2 overflow-hidden">
      <button onClick={() => setExpanded((e) => !e)} className="w-full text-left pl-3 pr-3 py-2.5">
        <div className="flex justify-between items-center gap-2 text-sm mb-1">
          <span className={`min-w-0 truncate ${f.deleted ? "font-medium text-stone-500" : "font-medium"}`}>
            {f.name}
            {f.deleted && <span className="font-normal"> (eliminado)</span>}
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-xs">
              {fmt(f.total)}
              {/* pct es null cuando el saldo de inicio de mes era 0 (p. ej. fondo creado este mismo mes
                  sin saldo inicial): no hay una base con la que calcular un % con sentido, así que no se
                  muestra ningún porcentaje ni barra, solo el importe gastado. */}
              {!f.deleted && f.pct != null && ` · ${f.pct.toFixed(0)}% del saldo inicial`}
            </span>
            {expanded ? <ChevronUp size={14} className="text-stone-500" /> : <ChevronDown size={14} className="text-stone-500" />}
          </span>
        </div>
        {!f.deleted && f.pct != null && (
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, f.pct)}%` }} />
          </div>
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-2.5">
          {/* Saldo REAL actual del fondo (mismo número que la tarjeta de Fondos) — distinto del saldo de
              inicio de mes que usa el % de arriba como base; ambos son datos útiles y complementarios. */}
          {!f.deleted && <p className="text-xs text-stone-500 mb-2">{fmt(f.balance)} tienes ahora en este fondo</p>}
          <div className="border-l-2 border-stone-100 ml-1 pl-3 space-y-1.5">
            {f.cats.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs text-stone-500">
                  <span>{c.name}</span>
                  <span className="font-mono">
                    {fmt(c.total)} · {c.pct.toFixed(0)}% del gasto
                  </span>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-200" style={{ width: `${Math.min(100, c.pct)}%` }} />
                </div>
                {/* Subcategorías: mismo estilo anidado que CategoryCard.tsx en el desglose normal de
                    Mensual. c.subcats ya llega vacío en free (se filtra en MensualTab, subcategorías son
                    premium), así que no hace falta comprobar isPremium aquí también. */}
                {c.subcats.length > 0 && (
                  <div className="border-l-2 border-stone-100 ml-1 pl-3 mt-1.5 space-y-1">
                    {c.subcats.map((sc) => (
                      <div key={sc.name} className="flex justify-between text-[11px] text-stone-500">
                        <span>{sc.name}</span>
                        <span className="font-mono">{fmt(sc.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
