import { expect, test, vi } from "vitest";

import {
  buildPdfUploadPlan,
  uploadPdfDocumentToCloud,
} from "@/features/library/library-client";
import { buildPdfStoragePath } from "@/features/library/storage-path";

test("builds user-scoped pdf storage paths", () => {
  expect(buildPdfStoragePath("user-1", "doc-1")).toBe(
    "users/user-1/pdf/doc-1.pdf",
  );
});

test("builds a cloud upload plan with metadata", () => {
  const plan = buildPdfUploadPlan({
    userId: "user-1",
    file: new File([new Uint8Array(2048)], "lesson-1.pdf", {
      type: "application/pdf",
    }),
    documentId: "doc-1",
    createdAt: "2026-03-25T10:00:00.000Z",
    storageQuotaBytes: 4096,
    storageUsedBytes: 1024,
  });

  expect(plan.storagePath).toBe("users/user-1/pdf/doc-1.pdf");
  expect(plan.pdfDocument).toEqual({
    id: "doc-1",
    userId: "user-1",
    fileName: "lesson-1.pdf",
    fileSizeBytes: 2048,
    storagePath: "users/user-1/pdf/doc-1.pdf",
    createdAt: "2026-03-25T10:00:00.000Z",
  });
  expect(plan.withinQuota).toBe(true);
});

test("rejects cloud uploads when quota is exceeded", () => {
  const plan = buildPdfUploadPlan({
    userId: "user-1",
    file: new File([new Uint8Array(200)], "lesson-1.pdf", {
      type: "application/pdf",
    }),
    documentId: "doc-1",
    createdAt: "2026-03-25T10:00:00.000Z",
    storageQuotaBytes: 1024,
    storageUsedBytes: 900,
  });

  expect(plan.withinQuota).toBe(false);
});

test("uploads cloud pdf metadata to storage and database", async () => {
  const upload = vi.fn().mockResolvedValue({ error: null });
  const insert = vi.fn().mockResolvedValue({ error: null });
  const client = {
    storage: {
      from: vi.fn(() => ({
        upload,
      })),
    },
    from: vi.fn(() => ({
      insert,
    })),
  };

  const plan = await uploadPdfDocumentToCloud({
    client: client as never,
    file: new File(["pdf"], "lesson-1.pdf", { type: "application/pdf" }),
    userId: "user-1",
    documentId: "doc-1",
    createdAt: "2026-03-25T10:00:00.000Z",
    storageQuotaBytes: 4096,
    storageUsedBytes: 1024,
  });

  expect(plan.storagePath).toBe("users/user-1/pdf/doc-1.pdf");
  expect(upload).toHaveBeenCalledWith(
    "users/user-1/pdf/doc-1.pdf",
    expect.any(File),
    {
      contentType: "application/pdf",
      upsert: false,
    },
  );
  expect(insert).toHaveBeenCalledWith([
    {
      id: "doc-1",
      userId: "user-1",
      fileName: "lesson-1.pdf",
      fileSizeBytes: 3,
      storagePath: "users/user-1/pdf/doc-1.pdf",
      createdAt: "2026-03-25T10:00:00.000Z",
    },
  ]);
});
