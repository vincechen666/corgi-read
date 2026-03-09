import { describe, expect, test } from "vitest";

import { resolveAnalysisMode } from "@/features/analysis/server/analysis-env";

describe("resolveAnalysisMode", () => {
  test("defaults to mock when no key exists", () => {
    expect(
      resolveAnalysisMode({
        AI_MODE: undefined,
        OPENROUTER_API_KEY: undefined,
      }),
    ).toBe("mock");
  });

  test("defaults to real when a key exists", () => {
    expect(
      resolveAnalysisMode({
        AI_MODE: undefined,
        OPENROUTER_API_KEY: "test-key",
      }),
    ).toBe("real");
  });
});
