type ChipTone = "neutral" | "fixed" | "variable" | "amber" | "indigo";

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: ChipTone;
}

const TONES: Record<ChipTone, string> = {
  fixed: "bg-slate-800 text-white border-slate-800",
  variable: "bg-rose-600 text-white border-rose-600",
  neutral: "bg-teal-700 text-white border-teal-700",
  // text-slate-900 (no text-white): bg-amber-600 no llega a 4.5:1 de contraste con blanco.
  amber: "bg-amber-600 text-slate-900 border-amber-600",
  indigo: "bg-indigo-600 text-white border-indigo-600",
};

const TONES_INACTIVE: Record<ChipTone, string> = {
  fixed: "border-stone-200 text-slate-600 bg-white",
  variable: "border-stone-200 text-rose-700 bg-white",
  neutral: "border-stone-200 text-teal-800 bg-white",
  amber: "border-stone-200 text-amber-700 bg-white",
  indigo: "border-stone-200 text-indigo-700 bg-white",
};

export function Chip({ label, active, onClick, tone = "neutral" }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[44px] flex items-center justify-center text-xs rounded-full px-3 py-1.5 border whitespace-nowrap ${active ? TONES[tone] : TONES_INACTIVE[tone]}`}
    >
      {label}
    </button>
  );
}
