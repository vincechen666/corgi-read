import { describe, expect, test, vi } from "vitest";

import { requestOpenRouterAnalysis } from "@/features/analysis/server/openrouter-client";

describe("requestOpenRouterAnalysis", () => {
  test("parses a structured json response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                transcript: "People knew Multivac well...",
                corrected: "People felt close to Multivac...",
                grammar: "这里应用 yet 更自然。",
                nativeExpression: "its mysteries still seemed beyond them",
                coachFeedback: "整体准确。",
              }),
            },
          },
        ],
      }),
    });

    const result = await requestOpenRouterAnalysis(
      {
        apiKey: "test-key",
        baseUrl: "https://openrouter.ai/api/v1",
        model: "stepfun/step-3.5-flash",
      },
      "People knew Multivac well...",
      fetchMock,
    );

    expect(result.corrected).toMatch(/felt close/);
  });
});
