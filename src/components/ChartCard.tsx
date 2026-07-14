import type { ReactNode } from "react";
import { useTapOutsideReset } from "../hooks/useTapOutsideReset";

interface ChartCardProps {
  title: string;
  explanation: string;
  height?: number;
  children: ReactNode;
}

export function ChartCard({ title, explanation, height, children }: ChartCardProps) {
  const { containerRef, resetKey } = useTapOutsideReset<HTMLDivElement>();
  return (
    <div className="mb-4">
      <p className="text-sm font-medium mb-2">{title}</p>
      <div ref={containerRef} className="bg-white rounded-lg border border-stone-100 p-2" style={height ? { height } : undefined}>
        <div key={resetKey} className="w-full h-full">
          {children}
        </div>
      </div>
      <p className="text-xs text-stone-400 mt-1.5">{explanation}</p>
    </div>
  );
}
