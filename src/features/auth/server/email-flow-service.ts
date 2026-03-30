import { createSupabaseServerAdminClient } from "@/features/auth/supabase-server";

type EmailFlowUserRecord = {
  email: string | null;
  email_confirmed_at: string | null;
};

type EmailFlowAdminClient = {
  auth: {
    admin: {
      listUsers: (options: {
        page: number;
        perPage: number;
      }) => Promise<{
        data: { users: EmailFlowUserRecord[] };
        error: Error | null;
      }>;
    };
  };
};

const PAGE_SIZE = 100;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function findUserByEmail(
  client: EmailFlowAdminClient,
  email: string,
): Promise<EmailFlowUserRecord | null> {
  const normalizedEmail = normalizeEmail(email);

  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (record) => normalizeEmail(record.email ?? "") === normalizedEmail,
    );

    if (user) {
      return user;
    }

    if (data.users.length < PAGE_SIZE) {
      return null;
    }
  }
}

export async function getEmailFlow(
  email: string,
  client: EmailFlowAdminClient = createSupabaseServerAdminClient() as unknown as EmailFlowAdminClient,
): Promise<"signup-link" | "login-code"> {
  const user = await findUserByEmail(client, email);

  if (!user?.email_confirmed_at) {
    return "signup-link";
  }

  return "login-code";
}
