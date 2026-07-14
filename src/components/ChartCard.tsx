import { useState, type ReactNode } from "react";
import { X } from "lucide-react";

interface ChartCardProps {
  title: string;
  explanation: string;
  height?: number;
  children: ReactNode;
}

export function ChartCard({ title, explanation, height, children }: ChartCardProps) {
  // Con trigger="click" en los Tooltip de Recharts, no hay forma de que se cierren solos (ni al tocar
  // fuera: un listener global para eso rompía la navegación de toda la app). Este botón remonta el
  // gráfico (cambia su key) para forzar el cierre, con un simple estado local — sin escuchar toques en
  // el resto de la pantalla.
  const [resetKey, setResetKey] = useState(0);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{title}</p>
        <button
          onClick={() => setResetKey((k) => k + 1)}
          title="Cerrar detalle del gráfico"
          className="text-stone-300 hover:text-slate-700 shrink-0"
        >
          <X size={14} />
        </button>
      </div>
      <div className="bg-white rounded-lg border border-stone-100 p-2" style={height ? { height } : undefined}>
        <div key={resetKey} className="w-full h-full">
          {children}
        </div>
      </div>
      <p className="text-xs text-stone-400 mt-1.5">{explanation}</p>
    </div>
  );
}
