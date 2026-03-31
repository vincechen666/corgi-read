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

export function createSupabaseServerAdminClient(
  env: Parameters<typeof getAuthConfig>[0] = process.env,
): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "createSupabaseServerAdminClient can only be used on the server",
    );
  }

  const { url } = getAuthConfig(env);
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
