import type { SupabaseClient } from "@supabase/supabase-js";

import {
  pdfDocumentSchema,
  type PdfDocument,
} from "@/features/library/library-schema";
import { buildPdfStoragePath } from "@/features/library/storage-path";

export const PDF_STORAGE_BUCKET = "pdf-documents";

export type PdfUploadPlanInput = {
  userId: string;
  file: File;
  storageQuotaBytes?: number;
  storageUsedBytes?: number;
  documentId?: string;
  createdAt?: string;
};

export type PdfUploadPlan = {
  documentId: string;
  storagePath: string;
  pdfDocument: PdfDocument;
  withinQuota: boolean;
};

function createDocumentId() {
  return crypto.randomUUID();
}

export function buildPdfUploadPlan({
  userId,
  file,
  storageQuotaBytes,
  storageUsedBytes,
  documentId = createDocumentId(),
  createdAt = new Date().toISOString(),
}: PdfUploadPlanInput): PdfUploadPlan {
  const storagePath = buildPdfStoragePath(userId, documentId);
  const pdfDocument = pdfDocumentSchema.parse({
    id: documentId,
    userId,
    fileName: file.name,
    fileSizeBytes: file.size,
    storagePath,
    createdAt,
  });
  const withinQuota =
    storageQuotaBytes === undefined || storageUsedBytes === undefined
      ? true
      : storageUsedBytes + file.size <= storageQuotaBytes;

  return {
    documentId,
    storagePath,
    pdfDocument,
    withinQuota,
  };
}

export type UploadPdfDocumentToCloudParams = PdfUploadPlanInput & {
  client: SupabaseClient;
};

export async function uploadPdfDocumentToCloud({
  client,
  ...input
}: UploadPdfDocumentToCloudParams) {
  const plan = buildPdfUploadPlan(input);

  if (!plan.withinQuota) {
    throw new Error("Storage quota exceeded");
  }

  const storageResult = await client.storage
    .from(PDF_STORAGE_BUCKET)
    .upload(plan.storagePath, input.file, {
      contentType: input.file.type || "application/pdf",
      upsert: false,
    });

  if (storageResult.error) {
    throw new Error(
      `Supabase storage upload failed: ${storageResult.error.message}`,
    );
  }

  const metadataResult = await client
    .from("pdf_documents")
    .insert([plan.pdfDocument]);

  if (metadataResult.error) {
    throw new Error(
      `Supabase metadata insert failed: ${metadataResult.error.message}`,
    );
  }

  return plan;
}
