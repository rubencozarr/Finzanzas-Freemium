import { Crown } from "lucide-react";

interface PremiumGateProps {
  message: string;
  /** Si se pasa, muestra un botón "Ver planes" que lleva a la tarjeta "Tu plan" en Ajustes — así
   * quien choca con este límite puede ir directo a pagar sin tener que buscar dónde está la opción. */
  onGoToAjustes?: () => void;
}

// Aviso sutil de conversión (no bloqueante): el componente que lo usa decide cuándo mostrarlo,
// según los helpers de useSubscription (p. ej. canCreateFund). Nunca deshabilita la acción por sí solo.
export function PremiumGate({ message, onGoToAjustes }: PremiumGateProps) {
  return (
    <div className="flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
      <Crown size={14} className="shrink-0 mt-0.5 text-amber-500" />
      <div className="flex-1 min-w-0">
        <p>{message}</p>
        {onGoToAjustes && (
          <button onClick={onGoToAjustes} className="text-amber-900 underline font-medium mt-0.5">
            Ver planes
          </button>
        )}
      </div>
    </div>
  );
}
