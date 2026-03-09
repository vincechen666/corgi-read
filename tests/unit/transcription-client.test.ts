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
