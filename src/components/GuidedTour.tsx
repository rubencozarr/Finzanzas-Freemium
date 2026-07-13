import { useEffect, useState, type CSSProperties } from "react";
import type { TourStep } from "../lib/tourSteps";

interface GuidedTourProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

const PADDING = 8;
const GAP = 14;
const OVERLAY_Z = 9997;
const RING_Z = 9998;
const TOOLTIP_Z = 9999;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Recorrido guiado tipo "spotlight": oscurece toda la pantalla excepto un hueco recortado sobre
 * el elemento real señalado (localizado en vivo por selector CSS), que queda 100% interactivo.
 * El resto de la pantalla queda bloqueada mediante 4 paneles oscuros alrededor del hueco.
 */
export function GuidedTour({ step, stepIndex, totalSteps, onNext, onSkip }: GuidedTourProps) {
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

  useEffect(() => {
    if (!step.target) return;
    const update = () => {
      const el = document.querySelector(step.target as string);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step.target]);

  const isLast = stepIndex === totalSteps - 1;
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

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
  if (!r) {
    tooltipStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: tooltipWidth };
  } else {
    const left = clamp(r.left, 12, vw - tooltipWidth - 12);
    if (step.placement === "top") {
      tooltipStyle = { bottom: vh - r.top + GAP, left, width: tooltipWidth };
    } else if (step.placement === "left") {
      tooltipStyle = { top: clamp(r.top, 12, vh - 220), right: vw - r.left + GAP, width: tooltipWidth };
    } else if (step.placement === "right") {
      tooltipStyle = { top: clamp(r.top, 12, vh - 220), left: r.right + GAP, width: tooltipWidth };
    } else {
      tooltipStyle = { top: r.bottom + GAP, left, width: tooltipWidth };
    }
  }

  return (
    <>
      {r ? (
        <>
          {/* Panel superior */}
          <div className="fixed bg-slate-900/75" style={{ top: 0, left: 0, width: vw, height: r.top, zIndex: OVERLAY_Z }} />
          {/* Panel inferior */}
          <div
            className="fixed bg-slate-900/75"
            style={{ top: r.bottom, left: 0, width: vw, height: Math.max(0, vh - r.bottom), zIndex: OVERLAY_Z }}
          />
          {/* Panel izquierdo (misma franja vertical que el hueco) */}
          <div
            className="fixed bg-slate-900/75"
            style={{ top: r.top, left: 0, width: r.left, height: r.bottom - r.top, zIndex: OVERLAY_Z }}
          />
          {/* Panel derecho */}
          <div
            className="fixed bg-slate-900/75"
            style={{ top: r.top, left: r.right, width: Math.max(0, vw - r.right), height: r.bottom - r.top, zIndex: OVERLAY_Z }}
          />
          {/* Anillo decorativo alrededor del hueco, no bloquea clics */}
          <div
            className="fixed rounded-lg border-2 border-teal-400 pointer-events-none transition-all duration-200"
            style={{ top: r.top, left: r.left, width: r.right - r.left, height: r.bottom - r.top, zIndex: RING_Z }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-slate-900/75" style={{ zIndex: OVERLAY_Z }} />
      )}

      <div className="fixed bg-white rounded-xl shadow-xl p-4" style={{ ...tooltipStyle, zIndex: TOOLTIP_Z }}>
        <p className="text-sm text-slate-700 mb-4">{step.text}</p>
        <div className="flex items-center justify-between gap-3">
          <button onClick={onSkip} className="text-xs text-stone-400 shrink-0">
            Omitir tutorial
          </button>
          <button onClick={onNext} className="bg-teal-700 text-white rounded-lg px-4 py-2 text-xs font-medium shrink-0">
            {isLast ? "Empezar" : "Siguiente"}
          </button>
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
