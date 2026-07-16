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

  // Además de resize/scroll normales, escucha window.visualViewport: es la API que realmente informa
  // cuando el teclado móvil aparece/desaparece (window.innerHeight no cambia en la mayoría de
  // navegadores móviles al abrir el teclado, así que sin esto el anillo se quedaba calculado para el
  // alto de pantalla completo y se desajustaba en cuanto se enfocaba un input como el de importe).
  useEffect(() => {
    if (!step.target) return;
    const update = () => {
      const el = document.querySelector(step.target as string);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [step.target]);

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
    if (step.placement === "top") {
      tooltipStyle = { bottom: vh - r.top + GAP, left, width: tooltipWidth };
      arrowStyle = { left: clamp(targetCenterX - left, 16, tooltipWidth - 16) - 6, bottom: -6 };
    } else if (step.placement === "left") {
      const top = clamp(r.top, 12, vh - 220);
      tooltipStyle = { top, right: vw - r.left + GAP, width: tooltipWidth };
      arrowStyle = { top: clamp(targetCenterY - top, 16, 188) - 6, right: -6 };
    } else if (step.placement === "right") {
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
