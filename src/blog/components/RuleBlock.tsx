import type { ReactNode } from "react";

type RuleTone = "slate" | "rose" | "teal";

const TONE_STYLES: Record<RuleTone, string> = {
  slate: "bg-slate-50 border-slate-400",
  rose: "bg-rose-50 border-rose-400",
  teal: "bg-teal-50 border-teal-400",
};

interface RuleBlockProps {
  tone: RuleTone;
  percent: string;
  title: string;
  children: ReactNode;
}

// Los tres bloques de la regla 50-30-20 (necesidades/deseos/ahorro), reutilizados tanto al explicar la
// regla como al mapearla a la estructura de Nitid — mismos colores en los dos sitios (coinciden con los
// que usa la propia app para categorías fijas/variables/ahorro) para que la asociación sea inmediata.
export function RuleBlock({ tone, percent, title, children }: RuleBlockProps) {
  return (
    <div className={`p-4 rounded-r-xl border-l-4 ${TONE_STYLES[tone]}`}>
      <p className="font-bold text-stone-900">
        {percent} — {title}
      </p>
      <div className="mt-1 text-sm text-stone-600 leading-relaxed">{children}</div>
    </div>
  );
}
