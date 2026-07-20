import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface ResetPasswordScreenProps {
  onSubmit: (password: string) => Promise<{ error: { message: string } | null }>;
  onDone: () => void;
}

function friendlyError(message: string): string {
  if (message.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (message.includes("same_password") || message.includes("different from the old")) {
    return "La nueva contraseña debe ser distinta de la actual.";
  }
  return message;
}

/** Se muestra en vez de la app normal mientras dura la sesión de recuperación de contraseña (evento
 * PASSWORD_RECOVERY de Supabase) — ver useAuth.ts y el render condicional en App.tsx. */
export function ResetPasswordScreen({ onSubmit, onDone }: ResetPasswordScreenProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!password) {
      setError("Escribe tu contraseña nueva.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const { error } = await onSubmit(password);
    setLoading(false);
    if (error) {
      setError(friendlyError(error.message));
      return;
    }
    onDone();
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-slate-800 tracking-tight">Nueva contraseña</h1>
          <p className="text-stone-500 text-sm mt-1">Elige una contraseña nueva para tu cuenta.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña nueva"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 pr-10 text-base bg-white"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-slate-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative mb-3">
            <input
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 pr-10 text-base bg-white"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-slate-700"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="text-xs text-rose-600 mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium"
          >
            {loading ? "Un momento..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
