import { expect, test } from "vitest";

import {
  getDocumentExtension,
  getDocumentKindFromFile,
  normalizeDocumentLabel,
} from "@/features/document/document-types";

test("detects pdf and epub documents by mime type or extension", () => {
  expect(
    getDocumentKindFromFile(
      new File(["pdf"], "lesson", { type: "application/pdf" }),
    ),
  ).toBe("pdf");
  expect(
    getDocumentKindFromFile(
      new File(["epub"], "book", { type: "application/epub+zip" }),
    ),
  ).toBe("epub");
  expect(
    getDocumentKindFromFile(new File(["epub"], "book.EPUB", { type: "" })),
  ).toBe("epub");
});

test("rejects unsupported document files", () => {
  expect(
    getDocumentKindFromFile(new File(["txt"], "notes.txt", { type: "text/plain" })),
  ).toBeNull();
});

test("normalizes document labels and extensions", () => {
  expect(normalizeDocumentLabel(" lesson-3.epub ")).toBe("lesson-3.epub");
  expect(normalizeDocumentLabel("   ")).toBe("未命名文档");
  expect(getDocumentExtension("pdf")).toBe("pdf");
  expect(getDocumentExtension("epub")).toBe("epub");
});
