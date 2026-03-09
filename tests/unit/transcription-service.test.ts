import { expect, test, vi } from "vitest";

import { transcribeRetelling } from "@/features/transcription/server/transcription-service";

test("returns mock metadata in mock mode", async () => {
  const response = await transcribeRetelling({
    audioBuffer: Buffer.from("audio"),
    mimeType: "audio/webm",
    env: { TRANSCRIPTION_MODE: "mock" },
  });

  expect(response.meta.mode).toBe("mock");
  expect(response.meta.provider).toBe("mock");
});

test("normalizes provider transcript in real mode", async () => {
  const response = await transcribeRetelling({
    audioBuffer: Buffer.from("audio"),
    mimeType: "audio/webm",
    env: {
      TRANSCRIPTION_MODE: "real",
      BAIDU_SPEECH_API_KEY: "key",
      BAIDU_SPEECH_SECRET_KEY: "secret",
    },
    dependencies: {
      getToken: vi.fn().mockResolvedValue("token"),
      convertAudio: vi.fn().mockResolvedValue(undefined),
      requestProviderTranscript: vi
        .fn()
        .mockResolvedValue("people knew multivac well"),
      writeTempFile: vi
        .fn()
        .mockResolvedValue({ path: "/tmp/input.webm", cleanup: vi.fn() }),
      createTempPath: vi.fn().mockReturnValue("/tmp/output.wav"),
      readFile: vi.fn().mockResolvedValue(Buffer.from("wav")),
      removeFile: vi.fn().mockResolvedValue(undefined),
    },
  });

  expect(response.result.transcript).toBe("People knew multivac well.");
});
