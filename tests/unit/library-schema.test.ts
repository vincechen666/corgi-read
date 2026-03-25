import { expect, test } from "vitest";

import {
  cloudExpressionEntrySchema,
  cloudFavoriteEntrySchema,
  cloudRecordingEntrySchema,
  pdfDocumentSchema,
} from "@/features/library/library-schema";
import {
  type CloudExpressionEntry,
  type CloudFavoriteEntry,
  type CloudRecordingEntry,
} from "@/features/sidebar/sidebar-cloud-schema";

test("accepts minimal cloud pdf metadata", () => {
  const result = pdfDocumentSchema.parse({
    id: "doc-1",
    userId: "user-1",
    fileName: "lesson-1.pdf",
    fileSizeBytes: 2048,
    storagePath: "users/user-1/pdf/doc-1.pdf",
    createdAt: "2026-03-25T10:00:00.000Z",
  });

  expect(result.fileName).toBe("lesson-1.pdf");
});

test("accepts cloud recording rows used by the sidebar", () => {
  const result = cloudRecordingEntrySchema.parse({
    id: "recording-1",
    userId: "user-1",
    documentId: "doc-1",
    page: 12,
    createdAt: "2026-03-25T10:00:00.000Z",
    transcript: "People felt close to Multivac.",
    corrected: "People felt close to Multivac, yet its mysteries still seemed beyond them.",
    grammar: "Use a contrast connector for a smoother retelling.",
    nativeExpression: "its mysteries still seemed beyond them",
    coachFeedback: "Keep the contrast tight and natural.",
    summary: "A short retelling of the passage.",
    feedback: "AI 点评：理解准确，表达自然度不错。",
  } satisfies CloudRecordingEntry);

  expect(result.page).toBe(12);
});

test("accepts cloud favorite rows used by the sidebar", () => {
  const result = cloudFavoriteEntrySchema.parse({
    id: "favorite-1",
    userId: "user-1",
    documentId: "doc-1",
    sourceText: "faithful attendants of Multivac",
    translatedText: "Multivac 的忠实看护者",
    type: "sentence",
    page: 12,
    createdAt: "2026-03-25T10:00:00.000Z",
  } satisfies CloudFavoriteEntry);

  expect(result.type).toBe("sentence");
});

test("accepts cloud expression rows used by the sidebar", () => {
  const result = cloudExpressionEntrySchema.parse({
    id: "expression-1",
    userId: "user-1",
    documentId: "doc-1",
    sourcePhrase: "They felt close to Multivac, yet its mysteries stayed beyond them.",
    naturalPhrase: "They felt close to Multivac, yet its mysteries still seemed beyond them.",
    note: "更地道的对比句式。",
    sourceRecordingId: "recording-1",
    createdAt: "2026-03-25T10:00:00.000Z",
  } satisfies CloudExpressionEntry);

  expect(result.sourceRecordingId).toBe("recording-1");
});
