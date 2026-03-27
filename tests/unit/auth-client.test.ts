import { beforeEach, describe, expect, test, vi } from "vitest";

const signInWithOtpMock = vi.fn(async () => ({ error: null }));
const createSupabaseBrowserClientMock = vi.fn(() => ({
  auth: {
    signInWithOtp: signInWithOtpMock,
  },
}));

vi.mock("@/features/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: () => createSupabaseBrowserClientMock(),
}));

describe("startEmailLogin", () => {
  beforeEach(() => {
    signInWithOtpMock.mockClear();
    createSupabaseBrowserClientMock.mockClear();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://corgi.study");
  });

  test("prefers NEXT_PUBLIC_SITE_URL for email redirects", async () => {
    const { startEmailLogin } = await import("@/features/auth/auth-client");

    await startEmailLogin("reader@example.com");

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      options: {
        emailRedirectTo: "https://corgi.study",
      },
    });
  });
});
