import { describe, expect, test } from "vitest";

import { getEmailFlow } from "@/features/auth/server/email-flow-service";

function createClient(users: Array<{ email: string | null; email_confirmed_at: string | null }>) {
  return {
    auth: {
      admin: {
        listUsers: async () => ({
          data: { users },
          error: null,
        }),
      },
    },
  } as const;
}

describe("getEmailFlow", () => {
  test("returns login-code for a verified user", async () => {
    await expect(
      getEmailFlow(
        "reader@example.com",
        createClient([
          {
            email: "reader@example.com",
            email_confirmed_at: "2026-03-30T00:00:00Z",
          },
        ]),
      ),
    ).resolves.toBe("login-code");
  });

  test("returns signup-link when the user is missing", async () => {
    await expect(
      getEmailFlow("reader@example.com", createClient([])),
    ).resolves.toBe("signup-link");
  });

  test("returns signup-link for an unverified user", async () => {
    await expect(
      getEmailFlow(
        "reader@example.com",
        createClient([
          {
            email: "reader@example.com",
            email_confirmed_at: null,
          },
        ]),
      ),
    ).resolves.toBe("signup-link");
  });
});
