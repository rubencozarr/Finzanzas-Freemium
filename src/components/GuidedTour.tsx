import { useEffect, useState, type CSSProperties } from "react";
import type { TourStep } from "../lib/tourSteps";

interface GuidedTourProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const PADDING = 8;
const GAP = 14;
const RING_Z = 9998;
const TOOLTIP_Z = 9999;
// No se mide la altura real del tooltip (varía con el texto); esta estimación conservadora basta para
// decidir si hay hueco de sobra, y el margen de 12px absorbe el resto.
const ESTIMATED_TOOLTIP_HEIGHT = 180;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Recorrido guiado tipo "coachmark": el resto de la app se ve completamente normal (sin overlay
 * oscuro ni bloqueo de clics), y el elemento real señalado (localizado en vivo por selector CSS) se
 * marca con un anillo de resplandor teal que pulsa unas pocas veces y se queda fijo (ver
 * .tour-glow-ring en index.css). El tooltip flotante se coloca junto al elemento con una pequeña
 * flecha apuntando hacia él.
 */
export function GuidedTour({ step, stepIndex, totalSteps, onNext, onPrev, onSkip }: GuidedTourProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setRect(null);
    if (!step.target) return;
    let cancelled = false;
    let attempts = 0;
    let scrollTimer: number | undefined;
    let retryTimer: number | undefined;

    const tryFind = () => {
      if (cancelled) return;
      const el = document.querySelector(step.target as string);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        scrollTimer = window.setTimeout(() => {
          if (!cancelled) setRect(el.getBoundingClientRect());
        }, 350);
      } else if (attempts < 30) {
        attempts += 1;
        retryTimer = window.setTimeout(tryFind, 100);
      }
    };
    tryFind();

    return () => {
      cancelled = true;
      if (scrollTimer) window.clearTimeout(scrollTimer);
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [step.target]);

  // Seguimiento continuo por frame en vez de escuchar resize/scroll sueltos: el teclado móvil, el
  // scroll interno del modal (overflow-y-auto) y la transición de altura por dvh pueden mover el
  // elemento señalado sin disparar siempre esos eventos en el momento exacto (o con retraso respecto
  // a la animación), así que el anillo se quedaba desajustado. Comparar antes de llamar a setRect
  // evita re-renders de sobra cuando el elemento está quieto.
  useEffect(() => {
    if (!step.target) return;
    let rafId: number;
    let lastKey = "";
    const loop = () => {
      const el = document.querySelector(step.target as string);
      if (el) {
        const next = el.getBoundingClientRect();
        const key = `${next.top}|${next.left}|${next.width}|${next.height}`;
        if (key !== lastKey) {
          lastKey = key;
          setRect(next);
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [step.target]);

  // Solo para refrescar vw/vh (usados en el posicionamiento del tooltip): si el teclado abre/cierra
  // sin que el propio elemento señalado cambie de posición, el bucle de arriba no provoca un
  // re-render por sí solo.
  const [, bumpViewport] = useState(0);
  useEffect(() => {
    const bump = () => bumpViewport((t) => t + 1);
    window.visualViewport?.addEventListener("resize", bump);
    return () => window.visualViewport?.removeEventListener("resize", bump);
  }, []);

  const isLast = stepIndex === totalSteps - 1;
  const vw = typeof window !== "undefined" ? (window.visualViewport?.width ?? window.innerWidth) : 400;
  const vh = typeof window !== "undefined" ? (window.visualViewport?.height ?? window.innerHeight) : 800;

  const r = rect
    ? {
        top: Math.max(0, rect.top - PADDING),
        left: Math.max(0, rect.left - PADDING),
        right: Math.min(vw, rect.right + PADDING),
        bottom: Math.min(vh, rect.bottom + PADDING),
      }
    : null;

  const tooltipWidth = Math.min(320, vw - 24);
  let tooltipStyle: CSSProperties;
  let arrowStyle: CSSProperties | null = null;
  if (!r) {
    tooltipStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: tooltipWidth };
  } else {
    const left = clamp(r.left, 12, vw - tooltipWidth - 12);
    const targetCenterX = (r.left + r.right) / 2;
    const targetCenterY = (r.top + r.bottom) / 2;
    // El teclado móvil (o el scroll interno de un formulario largo) puede dejar al elemento señalado
    // sin hueco suficiente en la dirección pedida — p. ej. "top" con el target ya pegado arriba de la
    // pantalla visible. En ese caso se invierte al lado contrario en vez de solapar el tooltip con el
    // propio contenido que se supone que debe explicar.
    const minGap = ESTIMATED_TOOLTIP_HEIGHT + GAP + 12;
    let placement = step.placement;
    if (placement === "top" && r.top < minGap && vh - r.bottom >= minGap) {
      placement = "bottom";
    } else if (placement === "bottom" && vh - r.bottom < minGap && r.top >= minGap) {
      placement = "top";
    }
    if (placement === "top") {
      tooltipStyle = { bottom: vh - r.top + GAP, left, width: tooltipWidth };
      arrowStyle = { left: clamp(targetCenterX - left, 16, tooltipWidth - 16) - 6, bottom: -6 };
    } else if (placement === "left") {
      const top = clamp(r.top, 12, vh - 220);
      tooltipStyle = { top, right: vw - r.left + GAP, width: tooltipWidth };
      arrowStyle = { top: clamp(targetCenterY - top, 16, 188) - 6, right: -6 };
    } else if (placement === "right") {
      const top = clamp(r.top, 12, vh - 220);
      tooltipStyle = { top, left: r.right + GAP, width: tooltipWidth };
      arrowStyle = { top: clamp(targetCenterY - top, 16, 188) - 6, left: -6 };
    } else {
      tooltipStyle = { top: r.bottom + GAP, left, width: tooltipWidth };
      arrowStyle = { left: clamp(targetCenterX - left, 16, tooltipWidth - 16) - 6, top: -6 };
    }
  }

  return (
    <>
      {r && (
        <div
          key={`${step.target}-${stepIndex}`}
          className="tour-glow-ring fixed rounded-lg pointer-events-none"
          style={{ top: r.top, left: r.left, width: r.right - r.left, height: r.bottom - r.top, zIndex: RING_Z }}
        />
      )}

      <div className="fixed bg-white rounded-xl shadow-xl p-4" style={{ ...tooltipStyle, zIndex: TOOLTIP_Z }}>
        {arrowStyle && <div className="absolute w-3 h-3 bg-white rotate-45" style={arrowStyle} />}
        <p className="text-sm text-slate-700 mb-4">{step.text}</p>
        <div className="flex items-center justify-between gap-3">
          <button onClick={onSkip} className="text-xs text-stone-400 shrink-0">
            Omitir tutorial
          </button>
          <div className="flex items-center gap-2 shrink-0">
            {stepIndex > 0 && (
              <button onClick={onPrev} className="text-xs text-stone-500 px-1">
                Anterior
              </button>
            )}
            <button onClick={onNext} className="bg-teal-700 text-white rounded-lg px-4 py-2 text-xs font-medium">
              {isLast ? "Empezar" : "Siguiente"}
            </button>
          </div>
        </div>
        <div className="flex gap-1 mt-3 justify-center">
          {Array.from({ length: totalSteps }, (_, i) => (
            <span key={i} className={`w-1 h-1 rounded-full ${i === stepIndex ? "bg-teal-700" : "bg-stone-300"}`} />
          ))}
        </div>
      </div>
    </>
  );
}
