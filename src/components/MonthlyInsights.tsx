import { useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Crown, Flame, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";
import type { Insight, InsightType } from "../lib/calculations";

const TONE_CLASSES: Record<Insight["tone"], string> = {
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
  teal: "bg-teal-50 text-teal-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

const ICONS: Record<InsightType, ComponentType<{ size?: number; className?: string }>> = {
  categoria_subida: ArrowUp,
  presupuesto_racha: AlertTriangle,
  tasa_ahorro: TrendingUp,
  gasto_variable_baja: ArrowDown,
  racha_ahorro: Flame,
};

// Icono discreto en la esquina del insight que sí ve el free ("tasa_ahorro"), a modo de anzuelo hacia
// el resto de insights (premium-only). Toca para abrir/cerrar el tooltip; no se cierra solo al tocar
// fuera, igual que el desplegable de MonthSwitcher.
function PremiumHintBadge() {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute top-1.5 right-1.5">
      <button onClick={() => setOpen((o) => !o)} className="text-amber-500 hover:text-amber-600">
        <Crown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 w-40 bg-slate-800 text-white text-[11px] rounded-lg px-2.5 py-2 shadow-lg">
          Descubre más análisis de tus gastos con Premium
        </div>
      )}
    </div>
  );
}

export function MonthlyInsights({ insights, isPremium }: { insights: Insight[]; isPremium: boolean }) {
  if (insights.length === 0) return null;
  return (
    <div className="space-y-2 mb-5">
      {insights.map((insight) => {
        const Icon = ICONS[insight.type];
        const showPremiumHint = !isPremium && insight.type === "tasa_ahorro";
        return (
          <div key={insight.type} className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 ${TONE_CLASSES[insight.tone]}`}>
            <Icon size={16} className="shrink-0" />
            <p className={`text-xs ${showPremiumHint ? "pr-5" : ""}`}>{insight.text}</p>
            {showPremiumHint && <PremiumHintBadge />}
          </div>
        );
      })}
    </div>
  );
}
