import { beforeEach, describe, expect, test, vi } from "vitest";

const transcriptionServiceMocks = vi.hoisted(() => ({
  transcribeRetelling: vi.fn(),
}));

vi.mock("@/features/transcription/server/transcription-service", () => ({
  transcribeRetelling: transcriptionServiceMocks.transcribeRetelling,
}));

import { POST } from "@/app/api/transcribe/route";

describe("POST /api/transcribe", () => {
  beforeEach(() => {
    transcriptionServiceMocks.transcribeRetelling.mockReset();
  });

  test("parses uploaded audio and returns transcription metadata", async () => {
    transcriptionServiceMocks.transcribeRetelling.mockResolvedValue({
      result: {
        transcript: "People knew Multivac well.",
      },
      meta: {
        mode: "mock",
        provider: "mock",
        model: "mock",
      },
    });

    const formData = new FormData();
    formData.append(
      "audio",
      new File(["audio"], "recording.webm", { type: "audio/webm" }),
    );

    const response = await POST(
      new Request("http://localhost/api/transcribe", {
        method: "POST",
        body: formData,
      }),
    );
    const json = await response.json();

    expect(json.meta.provider).toBe("mock");
    expect(transcriptionServiceMocks.transcribeRetelling).toHaveBeenCalledWith(
      expect.objectContaining({
        mimeType: "audio/webm",
      }),
    );
  });
});
