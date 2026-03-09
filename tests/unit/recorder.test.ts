import { describe, expect, test } from "vitest";

import { nextRecordingState } from "@/features/recording/recorder";

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
