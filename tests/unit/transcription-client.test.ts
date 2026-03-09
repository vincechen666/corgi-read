import { afterEach, expect, test, vi } from "vitest";

import { transcribeAudio } from "@/features/analysis/analysis-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("posts real audio payload and parses transcription metadata", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      result: {
        transcript: "People knew Multivac well.",
      },
      meta: {
        mode: "mock",
        provider: "mock",
        model: "mock",
      },
    }),
  });

  vi.stubGlobal("fetch", fetchMock);

  const response = await transcribeAudio(
    new Blob(["audio"], { type: "audio/webm" }),
  );

  expect(response.meta.provider).toBe("mock");
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/transcribe",
    expect.objectContaining({
      method: "POST",
      body: expect.any(FormData),
    }),
  );
});

test("surfaces route detail when transcription fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({
        error: "Transcription failed, please retry.",
        detail: "Baidu transcription failed: 3302 No permission to access data",
      }),
    }),
  );

  await expect(
    transcribeAudio(new Blob(["audio"], { type: "audio/webm" })),
  ).rejects.toThrow(/3302/);
});
