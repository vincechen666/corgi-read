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

  test("returns debug detail in development when transcription fails", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    transcriptionServiceMocks.transcribeRetelling.mockRejectedValue(
      new Error("Baidu transcription failed: 3302 No permission to access data"),
    );

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

    expect(response.status).toBe(502);
    expect(json.detail).toMatch(/3302/);

    process.env.NODE_ENV = originalNodeEnv;
  });

  test("logs server-side transcription details in production without returning them to the client", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    transcriptionServiceMocks.transcribeRetelling.mockRejectedValue(
      new Error("ffmpeg conversion failed: Command failed: ffmpeg"),
    );

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

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

    expect(response.status).toBe(502);
    expect(json.error).toBe("Transcription failed, please retry.");
    expect(json.detail).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "[transcribe] request failed",
      expect.objectContaining({
        message: "ffmpeg conversion failed: Command failed: ffmpeg",
      }),
    );

    consoleError.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });
});
