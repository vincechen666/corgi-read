import { beforeEach, describe, expect, test, vi } from "vitest";

const createClientMock = vi.fn(() => ({ client: "supabase" }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

describe("createSupabaseBrowserClient", () => {
  beforeEach(() => {
    createClientMock.mockClear();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  });

  test("reads public Supabase config from statically referenced browser env values", async () => {
    const { createSupabaseBrowserClient } = await import(
      "@/features/auth/supabase-browser"
    );

    createSupabaseBrowserClient();

    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      },
    );
  });
});
