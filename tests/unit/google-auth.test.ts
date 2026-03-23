import { expect, test } from "vitest";

import { resolveGoogleAccessToken } from "@/features/translation/server/google-auth";

test("prefers explicit translation access token", async () => {
  const token = await resolveGoogleAccessToken(
    {
      GOOGLE_TRANSLATE_ACCESS_TOKEN: "explicit-token",
    },
    async () => {
      throw new Error("should not call fallback provider");
    },
  );

  expect(token).toBe("explicit-token");
});

test("falls back to adc token provider when explicit token is absent", async () => {
  const token = await resolveGoogleAccessToken(
    {
      GOOGLE_APPLICATION_CREDENTIALS: "/tmp/service-account.json",
    },
    async () => "adc-token",
  );

  expect(token).toBe("adc-token");
});

test("throws when no usable Google credentials exist", async () => {
  await expect(
    resolveGoogleAccessToken({}, async () => "unused"),
  ).rejects.toThrow(/Google translation credentials are required/i);
});
