import { ChevronDown, ChevronUp } from "lucide-react";
import { fmt } from "../lib/format";

export type GroupTone = "fixed" | "variable" | "ahorro" | "inversion" | "fondos";

export const GROUP_BADGE: Record<GroupTone, string> = {
  fixed: "bg-slate-700 text-white",
  variable: "bg-rose-600 text-white",
  ahorro: "bg-amber-600 text-white",
  inversion: "bg-indigo-600 text-white",
  fondos: "bg-teal-700 text-white",
};

interface GroupHeaderProps {
  title: string;
  total: number;
  tone: GroupTone;
  extra?: string | null;
  expanded: boolean;
  onToggle: () => void;
  /** false = solo cabecera informativa (sin chevron ni toggle), para bloques sin nada que expandir. */
  interactive?: boolean;
}

export function GroupHeader({ title, total, tone, extra, expanded, onToggle, interactive = true }: GroupHeaderProps) {
  const content = (
    <div className="flex justify-between items-center">
      <span className={`text-xs font-semibold uppercase tracking-wide rounded-full px-2.5 py-1 ${GROUP_BADGE[tone]} inline-flex items-center gap-1`}>
        {title}
        {interactive && (expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </span>
      <span className="font-mono text-sm">
        {fmt(total)}
        {extra ? <span className="text-stone-400"> · {extra}</span> : ""}
      </span>
    </div>
  );
  if (!interactive) {
    return <div className="w-full text-left mb-2">{content}</div>;
  }
  return (
    <button onClick={onToggle} className="w-full text-left mb-2">
      {content}
    </button>
  );
}
