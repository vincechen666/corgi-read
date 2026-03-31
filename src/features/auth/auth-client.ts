import { createSupabaseBrowserClient } from "@/features/auth/supabase-browser";

export function getEmailRedirectTo() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return undefined;
}

export async function startEmailSignupLink(email: string) {
  const client = createSupabaseBrowserClient();
  const redirectTo = getEmailRedirectTo();

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

export async function startEmailLoginCode(email: string) {
  const client = createSupabaseBrowserClient();

  const { error } = await client.auth.signInWithOtp({
    email,
  });

  if (error) {
    throw error;
  }
}

export async function verifyEmailLoginCode(email: string, token: string) {
  const client = createSupabaseBrowserClient();

  const { error } = await client.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    throw error;
  }
}
