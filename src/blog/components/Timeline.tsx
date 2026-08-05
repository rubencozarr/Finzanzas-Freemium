import type { ReactNode } from "react";

interface TimelineNode {
  period: string;
  title: string;
  description: ReactNode;
  emphasis?: boolean;
}

// Línea de progreso vertical (usada en el artículo de ahorro para el ejemplo "0€ a 1.200€ en un
// año"): cada nodo es un circulito con el periodo, conectado al siguiente por una barra que se
// estira con flex-1 dentro de la columna — su altura queda atada automáticamente a la de la tarjeta
// de al lado porque esa columna es un item más del flex row (align-items: stretch por defecto).
export function Timeline({ nodes }: { nodes: TimelineNode[] }) {
  return (
    <div className="flex flex-col">
      {nodes.map((node, i) => (
        <div key={node.period} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-600 text-white font-bold text-xs shrink-0">
              {node.period}
            </span>
            {i < nodes.length - 1 && <div className="w-0.5 flex-1 bg-teal-200 my-1" />}
          </div>
          <div
            className={`flex-1 mb-4 p-4 rounded-xl border ${node.emphasis ? "bg-emerald-50 border-emerald-200" : "bg-white border-stone-200"}`}
          >
            <p className="font-bold text-stone-900">{node.title}</p>
            <div className="mt-1 text-sm text-stone-600 leading-relaxed">{node.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
