import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type CalloutTone = "amber" | "teal" | "stone" | "emerald";

const TONE_STYLES: Record<CalloutTone, { bg: string; border: string; icon: string }> = {
  amber: { bg: "bg-amber-50", border: "border-amber-400", icon: "text-amber-500" },
  teal: { bg: "bg-teal-50", border: "border-teal-400", icon: "text-teal-500" },
  stone: { bg: "bg-stone-50", border: "border-stone-400", icon: "text-stone-500" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-400", icon: "text-emerald-500" },
};

interface CalloutProps {
  tone: CalloutTone;
  icon: LucideIcon;
  children: ReactNode;
}

export function Callout({ tone, icon: Icon, children }: CalloutProps) {
  const style = TONE_STYLES[tone];
  return (
    <div className={`flex gap-3 p-4 rounded-r-xl border-l-4 ${style.bg} ${style.border}`}>
      <Icon size={18} className={`${style.icon} shrink-0 mt-0.5`} strokeWidth={2} />
      <div className="text-sm text-stone-700 leading-relaxed flex flex-col gap-1">{children}</div>
    </div>
  );
}
