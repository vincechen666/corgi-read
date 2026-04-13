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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("startEmailLoginCode requests a one-time code and allows new users to be created", async () => {
    const { startEmailLoginCode } = await import("@/features/auth/auth-client");

    await startEmailLoginCode("reader@example.com");

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: "reader@example.com",
      options: {
        shouldCreateUser: true,
      },
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
