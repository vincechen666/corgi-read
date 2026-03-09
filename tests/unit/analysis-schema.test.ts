import { describe, expect, test } from "vitest";

import { analysisResultSchema } from "@/features/analysis/analysis-schema";

describe("analysisResultSchema", () => {
  test("accepts transcript, corrected text, grammar note, and coach feedback", () => {
    const result = analysisResultSchema.parse({
      transcript: "People knew Multivac well...",
      corrected: "People felt close to Multivac...",
      grammar: "know ... very well is too flat here.",
      nativeExpression: "its mysteries still seemed beyond them",
      coachFeedback: "Use stronger contrast words like yet or while.",
    });

    expect(result.nativeExpression).toMatch(/beyond them/);
  });
});
