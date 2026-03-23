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
    {},
    async () => "adc-token",
  );

  expect(token).toBe("adc-token");
});

test("passes through GOOGLE_APPLICATION_CREDENTIALS when present", async () => {
  let receivedPath: string | undefined;

  await resolveGoogleAccessToken(
    {
      GOOGLE_APPLICATION_CREDENTIALS: "/tmp/service-account.json",
    },
    async (env) => {
      receivedPath = env.GOOGLE_APPLICATION_CREDENTIALS;
      return "adc-token";
    },
  );

  expect(receivedPath).toBe("/tmp/service-account.json");
});

test("throws when no usable Google credentials exist", async () => {
  await expect(
    resolveGoogleAccessToken({}, async () => {
      throw new Error("adc unavailable");
    }),
  ).rejects.toThrow(/Google translation credentials are required/i);
});
