import { describe, expect, test } from "vitest";

import { getAuthConfig } from "@/features/auth/auth-env";

describe("getAuthConfig", () => {
  test("returns configured Supabase project values", () => {
    const config = getAuthConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(config.url).toBe("https://example.supabase.co");
    expect(config.anonKey).toBe("anon-key");
  });
});
