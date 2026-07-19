import { Crown } from "lucide-react";

interface PremiumGateProps {
  message: string;
  /** Si se pasa, muestra un botón "Ver planes" que abre PremiumScreen — así quien choca con este
   * límite puede ir directo a ver el valor y pagar sin tener que buscar dónde está la opción. */
  onOpenPremiumScreen?: () => void;
}

// Aviso sutil de conversión (no bloqueante): el componente que lo usa decide cuándo mostrarlo,
// según los helpers de useSubscription (p. ej. canCreateFund). Nunca deshabilita la acción por sí solo.
export function PremiumGate({ message, onOpenPremiumScreen }: PremiumGateProps) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
      <Crown size={14} className="shrink-0 mt-0.5 text-amber-500" />
      <span>
        {message}
        {onOpenPremiumScreen && (
          <>
            {" "}
            <button onClick={onOpenPremiumScreen} className="text-amber-900 underline font-medium">
              Ver planes
            </button>
          </>
        )}
      </span>
    </p>
  );
}
