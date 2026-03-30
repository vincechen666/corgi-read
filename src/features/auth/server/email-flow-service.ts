import { createSupabaseServerAdminClient } from "@/features/auth/supabase-server";

type EmailFlowProfileRow = {
  id: string;
};

type EmailFlowProfileLookupResult = {
  data: EmailFlowProfileRow | null;
  error: Error | null;
};

type EmailFlowAuthUser = {
  email_confirmed_at: string | null;
};

type EmailFlowUserLookupResult = {
  data: {
    user: EmailFlowAuthUser | null;
  };
  error: Error | null;
};

type EmailFlowClient = {
  from(table: string): {
    select(columns: string): {
      ilike(column: string, value: string): {
        maybeSingle(): Promise<EmailFlowProfileLookupResult>;
      };
    };
  };
  auth: {
    admin: {
      getUserById(uid: string): Promise<EmailFlowUserLookupResult>;
    };
  };
};

function normalizeEmail(email: string) {
  return email.trim();
}

async function findProfileIdByEmail(
  client: EmailFlowClient,
  email: string,
): Promise<string | null> {
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await client
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

async function isVerifiedUser(
  client: EmailFlowClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client.auth.admin.getUserById(userId);

  if (error) {
    throw error;
  }

  return Boolean(data.user?.email_confirmed_at);
}

export async function getEmailFlow(
  email: string,
  client: EmailFlowClient = createSupabaseServerAdminClient(),
): Promise<"signup-link" | "login-code"> {
  const profileId = await findProfileIdByEmail(client, email);

  if (!profileId) {
    return "signup-link";
  }

  return (await isVerifiedUser(client, profileId)) ? "login-code" : "signup-link";
}
