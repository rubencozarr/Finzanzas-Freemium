import { useEffect, useState } from "react";
import { isLocalBackend } from "../lib/env";
import { getSupabase } from "../lib/supabaseClient";

export interface AppUser {
  id: string;
  email?: string | null;
}

const LOCAL_USER: AppUser = { id: "local-user", email: "local@example.com" };

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(isLocalBackend ? LOCAL_USER : null);
  const [loading, setLoading] = useState(!isLocalBackend);

  useEffect(() => {
    if (isLocalBackend) return;
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setUser(newSession?.user ? { id: newSession.user.id, email: newSession.user.email } : null);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const signInWithPassword = (email: string, password: string) => getSupabase().auth.signInWithPassword({ email, password });
  const signUp = (email: string, password: string) => getSupabase().auth.signUp({ email, password });
  const signOut = () => (isLocalBackend ? Promise.resolve() : getSupabase().auth.signOut());

  return { user, loading, signInWithPassword, signUp, signOut };
}
