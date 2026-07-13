import { fmt } from "../lib/format";

export type StatCardTone = "emerald" | "rose" | "slate" | "teal" | "indigo" | "amber";

const TONES: Record<StatCardTone, string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  rose: "bg-rose-50 text-rose-800",
  slate: "bg-slate-100 text-slate-800",
  teal: "bg-teal-50 text-teal-800",
  indigo: "bg-indigo-50 text-indigo-800",
  amber: "bg-amber-50 text-amber-800",
};

interface StatCardProps {
  label: string;
  value: number;
  tone: StatCardTone;
}

export function StatCard({ label, value, tone }: StatCardProps) {
  return (
    <div className={`rounded-lg px-3 py-2.5 ${TONES[tone]}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="font-mono text-base mt-0.5">{fmt(value)}</p>
    </div>
  );
}
