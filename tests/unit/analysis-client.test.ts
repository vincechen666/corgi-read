import { afterEach, expect, test, vi } from "vitest";

import { analyzeTranscript } from "@/features/analysis/analysis-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("returns result and metadata from the analysis route", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          transcript: "People knew Multivac well...",
          corrected: "People felt close to Multivac...",
          grammar: "这里应用 yet 更自然。",
          nativeExpression: "its mysteries still seemed beyond them",
          coachFeedback: "整体准确。",
        },
        meta: {
          mode: "real",
          provider: "openrouter",
          model: "stepfun/step-3.5-flash",
        },
      }),
    }),
  );

  const response = await analyzeTranscript("People knew Multivac well...");

  expect(response.meta.provider).toBe("openrouter");
});
