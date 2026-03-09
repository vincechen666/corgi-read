import { expect, test } from "vitest";

import { createPdfStageState } from "@/features/pdf/pdf-file-state";

test("returns empty state when no file is selected", () => {
  expect(createPdfStageState(null, false, null)).toEqual({
    status: "empty",
    documentName: "未打开文档",
    source: null,
    error: null,
  });
});
