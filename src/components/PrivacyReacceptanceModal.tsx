import { useState } from "react";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";

interface PrivacyReacceptanceModalProps {
  onAccept: () => Promise<void>;
}

// Mismo patrón visual que LoginScreen/ResetPasswordScreen (reemplaza toda la pantalla, no un overlay
// encima de la app montada): App.tsx la renderiza como return temprano antes de montar cualquier pestaña.
export function PrivacyReacceptanceModal({ onAccept }: PrivacyReacceptanceModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!accepted) return;
    setLoading(true);
    setError(null);
    try {
      await onAccept();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar tu aceptación. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-6">
          <h1 className="font-serif text-xl text-slate-800 tracking-tight mb-2">Política de privacidad actualizada</h1>
          <p className="text-stone-600 text-sm">
            Hemos actualizado nuestra Política de Privacidad. Por favor, revísala y acéptala para continuar.
          </p>
        </div>

        <button onClick={() => setShowPolicy(true)} className="w-full text-center text-sm text-teal-700 underline mb-4">
          Leer la política de privacidad completa
        </button>

        <label className="flex items-start gap-2 text-xs text-stone-500 mb-4">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 shrink-0"
          />
          <span>He leído y acepto la Política de Privacidad actualizada</span>
        </label>

        {error && <p className="text-xs text-rose-600 mb-3">{error}</p>}

        <button
          onClick={confirm}
          disabled={!accepted || loading}
          className="w-full bg-slate-800 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium"
        >
          {loading ? "Un momento..." : "Aceptar y continuar"}
        </button>
      </div>

      {showPolicy && <PrivacyPolicyModal onClose={() => setShowPolicy(false)} />}
    </div>
  );
}
