import type { ReactNode } from "react";

interface StepCardProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function StepCard({ number, title, children }: StepCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-stone-100 border-b border-stone-200 flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-sm shrink-0">{number}</span>
        <h2 className="text-lg font-bold text-stone-900">{title}</h2>
      </div>
      <div className="p-6 flex flex-col gap-4 text-stone-600 leading-relaxed">{children}</div>
    </div>
  );
}
