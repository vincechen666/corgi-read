import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getAuthConfig } from "@/features/auth/auth-env";

export function createSupabaseBrowserClient(
  env: Parameters<typeof getAuthConfig>[0] = process.env,
): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("createSupabaseBrowserClient can only be used in the browser");
  }

  const { url, anonKey } = getAuthConfig(env);

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}
