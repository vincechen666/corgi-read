import { describe, expect, test } from "vitest";

import { transcriptionRouteResponseSchema } from "@/features/analysis/analysis-schema";

describe("transcriptionRouteResponseSchema", () => {
  test("accepts result and metadata", () => {
    const parsed = transcriptionRouteResponseSchema.parse({
      result: {
        transcript: "People knew Multivac well.",
      },
      meta: {
        mode: "mock",
        provider: "mock",
        model: "mock",
      },
    });

    expect(parsed.meta.provider).toBe("mock");
  });
});
