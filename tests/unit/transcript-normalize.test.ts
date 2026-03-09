import { expect, test } from "vitest";

import { normalizeTranscript } from "@/features/transcription/server/transcript-normalize";

test("normalizes english transcript punctuation and casing", () => {
  expect(normalizeTranscript("  people   knew multivac well  ")).toBe(
    "People knew multivac well.",
  );
});
