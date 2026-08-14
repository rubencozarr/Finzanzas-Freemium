import { X } from "lucide-react";

interface UpdateBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

// A diferencia de Toast (auto-desaparece a los 2.5s), este banner se queda hasta que el usuario lo
// cierra o pulsa actualizar: no tiene sentido que un aviso de "hay una versión nueva" desaparezca solo
// antes de que el usuario llegue a leerlo.
export function UpdateBanner({ onUpdate, onDismiss }: UpdateBannerProps) {
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 w-[92%] max-w-xs bg-slate-800 text-white rounded-lg shadow-lg z-50 px-4 py-3"
      style={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm">Hay una nueva versión disponible</span>
        <button onClick={onDismiss} className="shrink-0 text-stone-500 hover:text-white -mt-1 -mr-1 p-1" aria-label="Descartar aviso">
          <X size={14} />
        </button>
      </div>
      <button onClick={onUpdate} className="mt-2 w-full bg-teal-600 hover:bg-teal-500 rounded-md py-1.5 text-xs font-medium">
        Actualizar ahora
      </button>
    </div>
  );
}
