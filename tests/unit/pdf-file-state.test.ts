import { expect, test } from "vitest";

import {
  createPdfStageState,
  normalizePdfDocumentLabel,
} from "@/features/pdf/pdf-file-state";

test("returns empty state when no file is selected", () => {
  expect(createPdfStageState(null, false, null)).toEqual({
    status: "empty",
    documentName: "未打开文档",
    source: null,
    error: null,
  });
});

test("keeps the current document visible when a replacement upload fails", () => {
  expect(createPdfStageState("blob:lesson-3", false, "Please choose a PDF or EPUB file.")).toEqual({
    status: "ready",
    documentName: "已选中文档",
    source: "blob:lesson-3",
    error: "Please choose a PDF or EPUB file.",
  });
});

test("normalizes uploaded document labels before display", () => {
  expect(normalizePdfDocumentLabel(" lesson-3.epub ")).toBe("lesson-3.epub");
});
