import { useCallback } from "react";
import { getSupabase } from "../lib/supabaseClient";
import { isLocalBackend } from "../lib/env";
import { PRIVACY_POLICY_VERSION } from "../lib/constants";

// A diferencia de useOnboardingStatus/useSavingsMilestone (que leen un flag existente al montar), esto
// solo se escribe una vez, justo al registrarse — no hace falta estado ni refetch, el propio LoginScreen
// ya sabe el userId en el momento de llamarlo (viene directo de la respuesta de signUp).
export function usePrivacyAcceptance() {
  const recordAcceptance = useCallback(async (userId: string) => {
    if (isLocalBackend) return;
    const { error } = await getSupabase()
      .from("user_settings")
      .upsert({
        user_id: userId,
        privacy_accepted_at: new Date().toISOString(),
        privacy_version: PRIVACY_POLICY_VERSION,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
  }, []);

  return { recordAcceptance };
}
