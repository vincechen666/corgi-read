import { describe, expect, test } from "vitest";

import {
  getTranslationConfig,
  resolveTranslationMode,
} from "@/features/translation/server/translation-env";

describe("resolveTranslationMode", () => {
  test("defaults to mock when no Google credentials exist", () => {
    expect(
      resolveTranslationMode({
        TRANSLATION_MODE: undefined,
        GOOGLE_TRANSLATE_ACCESS_TOKEN: undefined,
        GOOGLE_APPLICATION_CREDENTIALS: undefined,
      }),
    ).toBe("mock");
  });

  test("defaults to real when explicit Google credentials exist", () => {
    expect(
      resolveTranslationMode({
        TRANSLATION_MODE: undefined,
        GOOGLE_TRANSLATE_ACCESS_TOKEN: "token",
      }),
    ).toBe("real");
  });

  test("defaults to real when a Google project is configured for ambient ADC runtimes", () => {
    expect(
      resolveTranslationMode({
        TRANSLATION_MODE: undefined,
        GOOGLE_CLOUD_PROJECT: "demo-project",
      }),
    ).toBe("real");
  });
});

test("returns google translation config defaults", () => {
  const config = getTranslationConfig({
    TRANSLATION_MODE: "real",
    GOOGLE_CLOUD_PROJECT: "demo-project",
  });

  expect(config.mode).toBe("real");
  expect(config.provider).toBe("google");
  expect(config.location).toBe("global");
  expect(config.projectId).toBe("demo-project");
});
