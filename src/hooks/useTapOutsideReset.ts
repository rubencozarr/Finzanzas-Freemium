import { useEffect, useRef, useState } from "react";

// Los Tooltip de Recharts con trigger="click" (ver ChartsSection.tsx, SparklineTrend.tsx,
// CategoryOverviewDonut.tsx) no tienen una API para cerrarse programáticamente cuando se toca fuera
// del gráfico. La forma fiable de "cerrarlos" es remontar el gráfico entero (cambiar su `key`), que
// resetea el estado interno de Recharts. `resetKey` sube en 1 cada vez que se detecta un toque fuera
// de `containerRef`; úsalo como `key` del elemento que envuelve el gráfico.
export function useTapOutsideReset<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (containerRef.current && e.target instanceof Node && !containerRef.current.contains(e.target)) {
        setResetKey((k) => k + 1);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  return { containerRef, resetKey };
}
