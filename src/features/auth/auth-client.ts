import { createSupabaseBrowserClient } from "@/features/auth/supabase-browser";

export async function startEmailLogin(email: string) {
  const client = createSupabaseBrowserClient();
  const redirectTo =
    typeof window === "undefined" ? undefined : window.location.origin;

  const { error } = await client.auth.signInWithOtp({
    email,
    options: redirectTo
      ? {
          emailRedirectTo: redirectTo,
        }
      : undefined,
  });

  if (error) {
    throw error;
  }
}
