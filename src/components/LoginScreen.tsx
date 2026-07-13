import { useState } from "react";
import type { useAuth } from "../hooks/useAuth";

type Mode = "login" | "signup";

interface LoginScreenProps {
  signInWithPassword: ReturnType<typeof useAuth>["signInWithPassword"];
  signUp: ReturnType<typeof useAuth>["signUp"];
}

function friendlyError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Email o contraseña incorrectos.";
  if (message.includes("User already registered")) return "Ya existe una cuenta con ese email. Inicia sesión.";
  if (message.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (message.includes("Unable to validate email address")) return "El email no es válido.";
  return message;
}

export function LoginScreen({ signInWithPassword, signUp }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError("Rellena email y contraseña.");
      return;
    }
    setLoading(true);
    if (mode === "login") {
      const { error } = await signInWithPassword(email.trim(), password);
      if (error) setError(friendlyError(error.message));
    } else {
      const { data, error } = await signUp(email.trim(), password);
      if (error) {
        setError(friendlyError(error.message));
      } else if (!data.session) {
        setInfo("Cuenta creada. Revisa tu email para confirmar la cuenta y luego inicia sesión.");
        setMode("login");
        setPassword("");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-slate-800 tracking-tight">Mis cuentas</h1>
          <p className="text-stone-500 text-sm mt-1">Registro, fondos y resúmenes</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p className="text-sm font-medium text-slate-800 mb-3">
            {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
          </p>

          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-base mb-3 bg-white"
          />
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-base mb-3 bg-white"
          />

          {error && <p className="text-xs text-rose-600 mb-3">{error}</p>}
          {info && <p className="text-xs text-emerald-700 mb-3">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium mb-3"
          >
            {loading ? "Un momento..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setInfo(null);
          }}
          className="w-full text-center text-xs text-stone-500"
        >
          {mode === "login" ? "¿No tienes cuenta? Crea una" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </div>
  );
}
