import { describe, expect, test } from "vitest";

import { normalizeSelectionText } from "@/features/pdf/pdf-selection";

describe("normalizeSelectionText", () => {
  test("collapses repeated whitespace from PDF text selection", () => {
    expect(normalizeSelectionText("felt   close\n to   Multivac")).toBe(
      "felt close to Multivac",
    );
  });
});
