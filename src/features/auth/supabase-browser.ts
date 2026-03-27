import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getAuthConfig } from "@/features/auth/auth-env";

const browserAuthEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function createSupabaseBrowserClient(
  env: Parameters<typeof getAuthConfig>[0] = browserAuthEnv,
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
