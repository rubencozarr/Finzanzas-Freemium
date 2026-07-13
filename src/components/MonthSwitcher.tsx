import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS_ES, MONTHS_FULL } from "../lib/constants";
import { round2 } from "../lib/format";

interface MonthSwitcherProps {
  monthIdx: number;
  year: number;
  changeMonth: (delta: number) => void;
  changeYear?: (delta: number) => void;
  goToMonthIndex?: (m: number) => void;
  getAhorroReal?: (year: number, monthIdx: number) => number;
}

export function MonthSwitcher({ monthIdx, year, changeMonth, changeYear, goToMonthIndex, getAhorroReal }: MonthSwitcherProps) {
  const [open, setOpen] = useState(false);
  const hasPicker = !!(changeYear && goToMonthIndex);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-stone-200 text-slate-600">
          <ChevronLeft size={18} />
        </button>
        {hasPicker ? (
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 font-serif text-base capitalize">
            {MONTHS_FULL[monthIdx]} {year}
            <ChevronDown size={15} className={`text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <span className="font-serif text-base capitalize">
            {MONTHS_FULL[monthIdx]} {year}
          </span>
        )}
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-stone-200 text-slate-600">
          <ChevronRight size={18} />
        </button>
      </div>
      {open && hasPicker && (
        <div className="mt-2 bg-white border border-stone-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2.5">
            <button onClick={() => changeYear!(-1)} className="p-1 rounded-full hover:bg-stone-100 text-slate-500">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium">{year}</span>
            <button onClick={() => changeYear!(1)} className="p-1 rounded-full hover:bg-stone-100 text-slate-500">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS_ES.map((m, i) => {
              // Redondeado a céntimos antes de comparar signo: una resta de importes en coma
              // flotante puede dejar un resto ínfimo (p. ej. -0.00000000000003) en vez de un 0
              // exacto, y sin este redondeo ese mes se pintaría en rojo en vez de en ámbar.
              const ahorro = round2(getAhorroReal ? getAhorroReal(year, i) : 0);
              const dot = ahorro > 0 ? "bg-teal-500" : ahorro < 0 ? "bg-rose-500" : "bg-amber-500";
              const active = i === monthIdx;
              return (
                <button
                  key={m}
                  onClick={() => {
                    goToMonthIndex!(i);
                    setOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 rounded-lg py-2 text-xs ${active ? "bg-slate-800 text-white" : "bg-stone-50 text-slate-600"}`}
                >
                  {m}
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${dot} ${active ? "ring-2 ring-white ring-offset-1 ring-offset-slate-800" : ""}`}
                  />
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-stone-400 mt-2">Verde: positivo · Ámbar: cero · Rojo: negativo</p>
        </div>
      )}
    </div>
  );
}
