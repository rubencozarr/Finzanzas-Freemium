import { AlertTriangle, ArrowDown, ArrowUp, Flame, TrendingUp } from "lucide-react";
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

export function MonthlyInsights({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="space-y-2 mb-5">
      {insights.map((insight) => {
        const Icon = ICONS[insight.type];
        return (
          <div key={insight.type} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 ${TONE_CLASSES[insight.tone]}`}>
            <Icon size={16} className="shrink-0" />
            <p className="text-xs">{insight.text}</p>
          </div>
        );
      })}
    </div>
  );
}
