import { createSupabaseBrowserClient } from "@/features/auth/supabase-browser";

export async function startEmailLoginCode(email: string) {
  const client = createSupabaseBrowserClient();

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
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
