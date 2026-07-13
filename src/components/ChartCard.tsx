import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  explanation: string;
  height?: number;
  children: ReactNode;
}

export function ChartCard({ title, explanation, height, children }: ChartCardProps) {
  return (
    <div className="mb-4">
      <p className="text-sm font-medium mb-2">{title}</p>
      <div className="bg-white rounded-lg border border-stone-100 p-2" style={height ? { height } : undefined}>
        {children}
      </div>
      <p className="text-xs text-stone-400 mt-1.5">{explanation}</p>
    </div>
  );
}
