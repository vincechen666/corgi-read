import { afterEach, expect, test, vi } from "vitest";

import { translateText } from "@/features/translation/server/translation-service";
import * as openRouterTranslationClient from "@/features/translation/server/openrouter-translation-client";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("returns the built-in dictionary translation immediately in real mode", async () => {
  const requestSpy = vi.spyOn(
    openRouterTranslationClient,
    "requestOpenRouterTranslation",
  );

  const result = await translateText("faithful attendants of Multivac", {
    AI_MODE: "real",
    OPENROUTER_API_KEY: "test-key",
    OPENROUTER_MODEL: "test-model",
    OPENROUTER_BASE_URL: "https://example.com/api/v1",
  });

  expect(result.translatedText).toBe("Multivac 的忠实看护者");
  expect(requestSpy).not.toHaveBeenCalled();
});

test("falls back to a local translation when the provider is too slow", async () => {
  vi.useFakeTimers();

  vi.spyOn(
    openRouterTranslationClient,
    "requestOpenRouterTranslation",
  ).mockImplementation(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            sourceText: "stellar cartography",
            translatedText: "恒星制图",
            note: "真实 provider 结果。",
          });
        }, 10_000);
      }),
  );

  const resultPromise = translateText("stellar cartography", {
    AI_MODE: "real",
    OPENROUTER_API_KEY: "test-key",
    OPENROUTER_MODEL: "test-model",
    OPENROUTER_BASE_URL: "https://example.com/api/v1",
  });

  await vi.advanceTimersByTimeAsync(1_500);

  await expect(resultPromise).resolves.toMatchObject({
    sourceText: "stellar cartography",
    translatedText: "中文翻译：stellar cartography",
  });
});
