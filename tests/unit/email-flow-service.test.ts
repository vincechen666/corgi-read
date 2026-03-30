import { describe, expect, test, vi } from "vitest";

import { getEmailFlow } from "@/features/auth/server/email-flow-service";

function createClient(options: {
  profileEmail?: string;
  profile: { id: string } | null;
  user: { email_confirmed_at: string | null } | null;
  profileError?: Error | null;
  userError?: Error | null;
}) {
  let profileQueryMatched = false;

  const getUserById = vi.fn(async () => ({
    data: { user: options.user },
    error: options.userError ?? null,
  }));

  const maybeSingle = vi.fn(async () => ({
    data: profileQueryMatched ? options.profile : null,
    error: options.profileError ?? null,
  }));

  const ilike = vi.fn((column: string, value: string) => {
    profileQueryMatched =
      column === "email" &&
      Boolean(options.profileEmail) &&
      value.toLowerCase() === options.profileEmail?.toLowerCase();

    return {
      maybeSingle,
    };
  });

  const select = vi.fn(() => ({
    ilike,
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
      ilike,
      maybeSingle,
      getUserById,
    },
  };
}

describe("getEmailFlow", () => {
  test("uses a case-insensitive profile lookup and returns login-code for a verified user", async () => {
    const client = createClient({
      profileEmail: "Reader@Example.com",
      profile: { id: "user-123" },
      user: { email_confirmed_at: "2026-03-30T00:00:00Z" },
    });

    await expect(
      getEmailFlow("  reader@example.com ", client),
    ).resolves.toBe("login-code");

    expect(client.mocks.from).toHaveBeenCalledWith("profiles");
    expect(client.mocks.select).toHaveBeenCalledWith("id");
    expect(client.mocks.ilike).toHaveBeenCalledWith(
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

  test("returns signup-link when the profile lookup fails", async () => {
    const client = createClient({
      profileEmail: "reader@example.com",
      profile: null,
      profileError: new Error("profiles lookup failed"),
      user: null,
    });

    await expect(
      getEmailFlow("reader@example.com", client),
    ).rejects.toThrow("profiles lookup failed");

    expect(client.mocks.getUserById).not.toHaveBeenCalled();
  });

  test("returns signup-link for an unverified user", async () => {
    const client = createClient({
      profileEmail: "reader@example.com",
      profile: { id: "user-123" },
      user: { email_confirmed_at: null },
    });

    await expect(
      getEmailFlow("reader@example.com", client),
    ).resolves.toBe("signup-link");

    expect(client.mocks.getUserById).toHaveBeenCalledWith("user-123");
  });

  test("returns signup-link when getUserById returns no user", async () => {
    const client = createClient({
      profileEmail: "reader@example.com",
      profile: { id: "user-123" },
      user: null,
    });

    await expect(
      getEmailFlow("reader@example.com", client),
    ).resolves.toBe("signup-link");

    expect(client.mocks.getUserById).toHaveBeenCalledWith("user-123");
  });
});
