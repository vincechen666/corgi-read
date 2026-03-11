import { describe, expect, test } from "vitest";

import {
  nextRecordingState,
  resolveRecordingMimeType,
} from "@/features/recording/recorder";

describe("nextRecordingState", () => {
  test("moves from idle to recording on primary click", () => {
    expect(nextRecordingState("idle", "primary-click")).toBe("recording");
  });

  test("moves from recording to processing on primary click", () => {
    expect(nextRecordingState("recording", "primary-click")).toBe("processing");
  });

  test("moves from processing back to idle when processing completes", () => {
    expect(nextRecordingState("processing", "processing-complete")).toBe("idle");
  });
});

describe("resolveRecordingMimeType", () => {
  test("prefers a browser-supported mime type instead of hard-coding webm", () => {
    const mediaRecorder = {
      isTypeSupported: (mimeType: string) =>
        mimeType === "audio/mp4" || mimeType === "audio/webm;codecs=opus",
    } as typeof MediaRecorder;

    expect(resolveRecordingMimeType(mediaRecorder)).toBe("audio/webm;codecs=opus");
  });

  test("falls back to an empty mime type when no preferred format is supported", () => {
    const mediaRecorder = {
      isTypeSupported: () => false,
    } as typeof MediaRecorder;

    expect(resolveRecordingMimeType(mediaRecorder)).toBe("");
  });
});
