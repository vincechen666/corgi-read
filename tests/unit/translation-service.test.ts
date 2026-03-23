import { afterEach, expect, test, vi } from "vitest";

import { translateText } from "@/features/translation/server/translation-service";
import * as googleTranslationClient from "@/features/translation/server/google-translation-client";
import * as googleAuth from "@/features/translation/server/google-auth";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("returns the built-in dictionary translation immediately in real mode", async () => {
  const requestSpy = vi.spyOn(
    googleTranslationClient,
    "requestGoogleTranslation",
  );

  const result = await translateText("faithful attendants of Multivac", {
    TRANSLATION_MODE: "real",
    GOOGLE_TRANSLATE_ACCESS_TOKEN: "test-token",
    GOOGLE_CLOUD_PROJECT: "demo-project",
  });

  expect(result.translatedText).toBe("Multivac 的忠实看护者");
  expect(requestSpy).not.toHaveBeenCalled();
});

test("uses Google translation in real mode for non-dictionary text", async () => {
  vi.spyOn(googleAuth, "resolveGoogleAccessToken").mockResolvedValue("token");
  const requestSpy = vi
    .spyOn(googleTranslationClient, "requestGoogleTranslation")
    .mockResolvedValue("恒星制图");

  const result = await translateText("stellar cartography", {
    TRANSLATION_MODE: "real",
    GOOGLE_TRANSLATE_ACCESS_TOKEN: "token",
    GOOGLE_CLOUD_PROJECT: "demo-project",
  });

  expect(requestSpy).toHaveBeenCalledWith(
    {
      accessToken: "token",
      projectId: "demo-project",
      location: "global",
    },
    "stellar cartography",
  );
  expect(result).toMatchObject({
    sourceText: "stellar cartography",
    translatedText: "恒星制图",
  });
  expect(result.note).toMatch(/Google/);
});

test("falls back to a local translation when the provider is too slow", async () => {
  vi.useFakeTimers();

  vi.spyOn(googleAuth, "resolveGoogleAccessToken").mockResolvedValue("token");

  vi.spyOn(
    googleTranslationClient,
    "requestGoogleTranslation",
  ).mockImplementation(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve("恒星制图");
        }, 10_000);
      }),
  );

  const resultPromise = translateText("stellar cartography", {
    TRANSLATION_MODE: "real",
    GOOGLE_TRANSLATE_ACCESS_TOKEN: "token",
    GOOGLE_CLOUD_PROJECT: "demo-project",
  });

  await vi.advanceTimersByTimeAsync(1_500);

  await expect(resultPromise).resolves.toMatchObject({
    sourceText: "stellar cartography",
    translatedText: "中文翻译：stellar cartography",
  });
});

test("logs provider failures before returning the local fallback", async () => {
  vi.spyOn(googleAuth, "resolveGoogleAccessToken").mockRejectedValue(
    new Error("Google ADC did not return an access token"),
  );
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

  const result = await translateText("stellar cartography", {
    TRANSLATION_MODE: "real",
    GOOGLE_CLOUD_PROJECT: "demo-project",
  });

  expect(result.translatedText).toBe("中文翻译：stellar cartography");
  expect(consoleError).toHaveBeenCalledWith(
    "[translate] provider fallback",
    expect.objectContaining({
      message: "Google ADC did not return an access token",
    }),
  );
});
