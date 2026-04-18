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
  const onProgress = vi.fn();
  const uploadFile = vi.fn(async ({ onProgress: reportProgress }) => {
    reportProgress?.(50, 100);
    reportProgress?.(100, 100);
  });
  const insert = vi.fn().mockResolvedValue({ error: null });
  const client = {
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn(),
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
    onProgress,
    uploadFile,
  });

  expect(plan.storagePath).toBe("users/user-1/pdf/doc-1.pdf");
  expect(uploadFile).toHaveBeenCalledWith({
    client: client,
    file: expect.any(File),
    path: "users/user-1/pdf/doc-1.pdf",
    onProgress: expect.any(Function),
  });
  expect(onProgress).toHaveBeenNthCalledWith(1, 50);
  expect(onProgress).toHaveBeenNthCalledWith(2, 100);
  expect(insert).toHaveBeenCalledWith([
    {
      id: "doc-1",
      user_id: "user-1",
      file_name: "lesson-1.pdf",
      file_size_bytes: 3,
      storage_path: "users/user-1/pdf/doc-1.pdf",
      created_at: "2026-03-25T10:00:00.000Z",
    },
  ]);
});

test("removes uploaded pdf from storage when metadata insert fails", async () => {
  const uploadFile = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue({ error: null });
  const insert = vi.fn().mockResolvedValue({
    error: { message: "metadata failed" },
  });
  const client = {
    storage: {
      from: vi.fn(() => ({
        remove,
      })),
    },
    from: vi.fn(() => ({
      insert,
    })),
  };

  await expect(
    uploadPdfDocumentToCloud({
      client: client as never,
      file: new File(["pdf"], "lesson-1.pdf", { type: "application/pdf" }),
      userId: "user-1",
      documentId: "doc-1",
      createdAt: "2026-03-25T10:00:00.000Z",
      uploadFile,
    }),
  ).rejects.toThrow("Supabase metadata insert failed: metadata failed");

  expect(remove).toHaveBeenCalledWith(["users/user-1/pdf/doc-1.pdf"]);
});
