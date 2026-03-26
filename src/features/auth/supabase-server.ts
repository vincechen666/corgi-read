import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getAuthConfig } from "@/features/auth/auth-env";

export function createSupabaseServerClient(
  env: Parameters<typeof getAuthConfig>[0] = process.env,
): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("createSupabaseServerClient can only be used on the server");
  }

  const { url, anonKey } = getAuthConfig(env);

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
