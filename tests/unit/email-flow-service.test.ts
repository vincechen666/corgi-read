import { describe, expect, test, vi } from "vitest";

import { getEmailFlow } from "@/features/auth/server/email-flow-service";

function createClient(options: {
  profile: { id: string } | null;
  user: { email_confirmed_at: string | null } | null;
}) {
  const getUserById = vi.fn(async () => ({
    data: { user: options.user },
    error: null,
  }));

  const maybeSingle = vi.fn(async () => ({
    data: options.profile,
    error: null,
  }));

  const eq = vi.fn(() => ({
    maybeSingle,
  }));

  const select = vi.fn(() => ({
    eq,
  }));

  const from = vi.fn(() => ({
    select,
  }));

  return {
    from,
    auth: {
      admin: {
        getUserById,
      },
    },
    mocks: {
      from,
      select,
      eq,
      maybeSingle,
      getUserById,
    },
  };
}

describe("getEmailFlow", () => {
  test("uses the profiles table and returns login-code for a verified user", async () => {
    const client = createClient({
      profile: { id: "user-123" },
      user: { email_confirmed_at: "2026-03-30T00:00:00Z" },
    });

    await expect(
      getEmailFlow(
        "  Reader@Example.com ",
        client,
      ),
    ).resolves.toBe("login-code");

    expect(client.mocks.from).toHaveBeenCalledWith("profiles");
    expect(client.mocks.select).toHaveBeenCalledWith("id");
    expect(client.mocks.eq).toHaveBeenCalledWith(
      "email",
      "reader@example.com",
    );
    expect(client.mocks.getUserById).toHaveBeenCalledWith("user-123");
  });

  test("returns signup-link when the profile row is missing", async () => {
    const client = createClient({
      profile: null,
      user: null,
    });

    await expect(getEmailFlow("reader@example.com", client)).resolves.toBe(
      "signup-link",
    );

    expect(client.mocks.getUserById).not.toHaveBeenCalled();
  });

  test("returns signup-link for an unverified user", async () => {
    const client = createClient({
      profile: { id: "user-123" },
      user: { email_confirmed_at: null },
    });

    await expect(
      getEmailFlow(
        "reader@example.com",
        client,
      ),
    ).resolves.toBe("signup-link");

    expect(client.mocks.getUserById).toHaveBeenCalledWith("user-123");
  });
});
