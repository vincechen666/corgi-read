import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const signInWithOtpMock = vi.fn(async () => ({ error: null }));
const verifyOtpMock = vi.fn(async () => ({ error: null }));
const createSupabaseBrowserClientMock = vi.fn(() => ({
  auth: {
    signInWithOtp: signInWithOtpMock,
    verifyOtp: verifyOtpMock,
  },
}));

vi.mock("@/features/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: () => createSupabaseBrowserClientMock(),
}));

describe("auth-client", () => {
  beforeEach(() => {
    signInWithOtpMock.mockClear();
    verifyOtpMock.mockClear();
    createSupabaseBrowserClientMock.mockClear();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://corgi.study/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("getEmailRedirectTo falls back to window.location.origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    const { getEmailRedirectTo } = await import("@/features/auth/auth-client");

    expect(getEmailRedirectTo()).toBe(window.location.origin);
  });

  test("startEmailSignupLink prefers NEXT_PUBLIC_SITE_URL for email redirects", async () => {
    const { startEmailSignupLink } = await import("@/features/auth/auth-client");

    await startEmailSignupLink("reader@example.com");

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      options: {
        emailRedirectTo: "https://corgi.study",
      },
    });
  });

  test("startEmailLoginCode requests a code without a redirect URL", async () => {
    const { startEmailLoginCode } = await import("@/features/auth/auth-client");

    await startEmailLoginCode("reader@example.com");

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: "reader@example.com",
    });
  });

  test("verifyEmailLoginCode verifies the email token", async () => {
    const { verifyEmailLoginCode } = await import("@/features/auth/auth-client");

    await verifyEmailLoginCode("reader@example.com", "123456");

    expect(verifyOtpMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      token: "123456",
      type: "email",
    });
  });
});
