import { describe, expect, test } from "vitest";

import {
  getTranscriptionConfig,
  resolveTranscriptionMode,
} from "@/features/transcription/server/transcription-env";

describe("resolveTranscriptionMode", () => {
  test("uses real mode when credentials exist", () => {
    expect(
      resolveTranscriptionMode({
        BAIDU_SPEECH_API_KEY: "key",
        BAIDU_SPEECH_SECRET_KEY: "secret",
      }),
    ).toBe("real");
  });
});

describe("getTranscriptionConfig", () => {
  test("defaults provider and model for baidu", () => {
    const config = getTranscriptionConfig({
      BAIDU_SPEECH_API_KEY: "key",
      BAIDU_SPEECH_SECRET_KEY: "secret",
    });

    expect(config.provider).toBe("baidu");
    expect(config.model).toBe("1737");
  });
});
