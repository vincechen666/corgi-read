import { describe, expect, test } from "vitest";

import { analyzeRetelling } from "@/features/analysis/server/analysis-service";

describe("analyzeRetelling", () => {
  test("returns mock metadata in mock mode", async () => {
    const response = await analyzeRetelling("People knew Multivac well...", {
      AI_MODE: "mock",
    });

    expect(response.meta.mode).toBe("mock");
    expect(response.meta.provider).toBe("mock");
  });

  test("throws when real mode is forced without key", async () => {
    await expect(
      analyzeRetelling("People knew Multivac well...", { AI_MODE: "real" }),
    ).rejects.toThrow(/OPENROUTER_API_KEY/);
  });
});
