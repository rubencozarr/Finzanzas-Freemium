import { useEffect, useState } from "react";
import { isLocalBackend } from "../lib/env";
import { getSupabase } from "../lib/supabaseClient";
import { clearAllLocal } from "../lib/localStore";

export interface AppUser {
  id: string;
  email?: string | null;
}

const LOCAL_USER: AppUser = { id: "local-user", email: "local@example.com" };

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(isLocalBackend ? LOCAL_USER : null);
  const [loading, setLoading] = useState(!isLocalBackend);
  // Al abrir el enlace de recuperación de contraseña, Supabase ya deja al usuario con una sesión
  // válida (user deja de ser null) antes de que haya cambiado nada — sin este flag, App.tsx dejaría
  // pasar directo a la app normal en vez de pedir la contraseña nueva primero.
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (isLocalBackend) return;
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setUser(newSession?.user ? { id: newSession.user.id, email: newSession.user.email } : null);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const signInWithPassword = (email: string, password: string) => getSupabase().auth.signInWithPassword({ email, password });
  const signUp = (email: string, password: string) => getSupabase().auth.signUp({ email, password });
  const signOut = () => (isLocalBackend ? Promise.resolve() : getSupabase().auth.signOut());
  const resetPasswordForEmail = (email: string) =>
    isLocalBackend
      ? Promise.resolve({ data: {}, error: null })
      : getSupabase().auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  const updatePassword = (password: string) =>
    isLocalBackend ? Promise.resolve({ data: { user: null }, error: null }) : getSupabase().auth.updateUser({ password });
  const clearPasswordRecovery = () => setPasswordRecovery(false);

  // Borra la cuenta y TODOS sus datos de forma permanente. El borrado real (auth.admin.deleteUser, que
  // en cascada se lleva por delante todas las tablas — ver api/delete-account.ts) solo puede hacerse
  // con la service role key, así que esto delega en esa función serverless en vez de intentarlo desde
  // aquí; el cliente nunca tiene esa clave. Al terminar con éxito cierra la sesión local, lo que hace
  // que App.tsx muestre el login solo (mismo mecanismo que un signOut normal).
  const deleteAccount = async (): Promise<{ error: string | null }> => {
    if (isLocalBackend) {
      clearAllLocal();
      return { error: null };
    }
    const supabase = getSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return { error: "No se pudo verificar tu sesión. Vuelve a iniciar sesión e inténtalo de nuevo." };

    let response: Response;
    try {
      response = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { error: "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo." };
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}) as { error?: string });
      return { error: body.error || "No se pudo eliminar la cuenta." };
    }

    await supabase.auth.signOut();
    return { error: null };
  };

  return {
    user,
    loading,
    passwordRecovery,
    signInWithPassword,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    clearPasswordRecovery,
    deleteAccount,
  };
}
