import { describe, expect, test } from "vitest";

import {
  analysisResultSchema,
  analysisRouteResponseSchema,
} from "@/features/analysis/analysis-schema";

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

  test("accepts result with route metadata", () => {
    const parsed = analysisRouteResponseSchema.parse({
      result: {
        transcript: "People knew Multivac well...",
        corrected: "People felt close to Multivac...",
        grammar: "这里用 yet 更自然。",
        nativeExpression: "its mysteries still seemed beyond them",
        coachFeedback: "整体准确，表达还可以更地道。",
      },
      meta: {
        mode: "real",
        provider: "openrouter",
        model: "stepfun/step-3.5-flash",
      },
    });

    expect(parsed.meta.provider).toBe("openrouter");
  });
});
