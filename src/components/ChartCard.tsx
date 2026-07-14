import { useState, type ReactNode } from "react";

interface ChartCardProps {
  title: string;
  explanation: string;
  height?: number;
  children: ReactNode;
}

export function ChartCard({ title, explanation, height, children }: ChartCardProps) {
  // Con trigger="click" en los Tooltip de Recharts, no hay forma de que se cierren solos (ni al tocar
  // fuera: un listener global para eso rompía la navegación de toda la app). En su lugar: primer toque
  // en el gráfico lo abre (comportamiento normal de Recharts), segundo toque en cualquier parte del
  // mismo gráfico lo cierra (remonta el gráfico, cambiando su key). Estado local, sin escuchar toques
  // fuera de este componente.
  const [resetKey, setResetKey] = useState(0);
  const [open, setOpen] = useState(false);
  const handleTap = () => {
    if (open) {
      setResetKey((k) => k + 1);
      setOpen(false);
    } else {
      setOpen(true);
    }
  };
  return (
    <div className="mb-4">
      <p className="text-sm font-medium mb-2">{title}</p>
      <div
        onClick={handleTap}
        className="bg-white rounded-lg border border-stone-100 p-2"
        style={height ? { height } : undefined}
      >
        <div key={resetKey} className="w-full h-full">
          {children}
        </div>
      </div>
      <p className="text-xs text-stone-400 mt-1.5">{explanation}</p>
    </div>
  );
}
