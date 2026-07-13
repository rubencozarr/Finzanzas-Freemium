import { Sparkles } from "lucide-react";

interface PremiumGateProps {
  message: string;
}

// Aviso sutil de conversión (no bloqueante): el componente que lo usa decide cuándo mostrarlo,
// según los helpers de useSubscription (p. ej. canCreateFund). Nunca deshabilita la acción por sí solo.
export function PremiumGate({ message }: PremiumGateProps) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-indigo-700 bg-indigo-50 rounded-md px-3 py-2">
      <Sparkles size={14} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </p>
  );
}
