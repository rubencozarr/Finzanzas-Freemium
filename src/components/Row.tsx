import { fmt } from "../lib/format";

type RowTone = "teal" | "indigo" | "amber" | "emerald";

interface RowProps {
  label: string;
  value: number;
  bold?: boolean;
  tone?: RowTone;
  muted?: boolean;
  pctText?: string;
}

const TONE_COLOR: Record<RowTone, string> = {
  teal: "text-teal-700",
  indigo: "text-indigo-700",
  amber: "text-amber-700",
  emerald: "text-emerald-700",
};

export function Row({ label, value, bold, tone, muted, pctText }: RowProps) {
  const toneColor = tone ? TONE_COLOR[tone] : "";
  return (
    <div className="flex justify-between">
      <span className={`${bold ? "font-medium" : muted ? "text-stone-400" : "text-stone-500"} ${toneColor}`}>{label}</span>
      <span className={`font-mono text-right ${bold ? "font-medium" : ""} ${tone ? toneColor : muted ? "text-stone-400" : ""}`}>
        {fmt(value)}
        {pctText ? <span className="text-stone-400"> · {pctText}</span> : ""}
      </span>
    </div>
  );
}
