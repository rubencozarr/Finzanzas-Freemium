import { useState, type ReactNode } from "react";

interface ChartCardProps {
  title: string;
  explanation: string;
  height?: number;
  // Función en vez de ReactNode plano: así el gráfico puede desactivar su animación de entrada al
  // reabrirse (ver comentario más abajo), sin que ChartsSection tenga que gestionar su propio estado.
  children: (animate: boolean) => ReactNode;
}

export function ChartCard({ title, explanation, height, children }: ChartCardProps) {
  // Con trigger="click" en los Tooltip de Recharts, no hay forma de que se cierren solos (ni al tocar
  // fuera: un listener global para eso rompía la navegación de toda la app). En su lugar: primer toque
  // en el gráfico lo abre (comportamiento normal de Recharts), segundo toque en cualquier parte del
  // mismo gráfico lo cierra (remonta el gráfico, cambiando su key). Estado local, sin escuchar toques
  // fuera de este componente.
  //
  // El remonte por sí solo hace que Recharts repita la animación de entrada (barras/líneas creciendo
  // desde cero) cada vez que se cierra el tooltip, no solo la primera vez que se ve el gráfico. `animate`
  // solo es true en el montaje inicial (resetKey === 0); a partir del primer cierre se desactiva la
  // animación de las gráficas via isAnimationActive, para que solo se anime la primera vez.
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
          {children(resetKey === 0)}
        </div>
      </div>
      <p className="text-xs text-stone-400 mt-1.5">{explanation}</p>
    </div>
  );
}
