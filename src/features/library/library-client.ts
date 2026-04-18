import type { SupabaseClient } from "@supabase/supabase-js";
import { Upload } from "tus-js-client";

import {
  pdfDocumentSchema,
  type PdfDocument,
} from "@/features/library/library-schema";
import { buildPdfStoragePath } from "@/features/library/storage-path";
import { toUploadProgressPercent } from "@/features/library/upload-progress";

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

type CloudPdfDocumentRow = {
  created_at: string;
  file_name: string;
  file_size_bytes: number;
  id: string;
  storage_path: string;
  user_id: string;
};

function createDocumentId() {
  return crypto.randomUUID();
}

function mapPdfDocumentToCloudRow(
  pdfDocument: PdfDocument,
): CloudPdfDocumentRow {
  return {
    id: pdfDocument.id,
    user_id: pdfDocument.userId,
    file_name: pdfDocument.fileName,
    file_size_bytes: pdfDocument.fileSizeBytes,
    storage_path: pdfDocument.storagePath,
    created_at: pdfDocument.createdAt,
  };
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
  onProgress?: (percent: number) => void;
  uploadFile?: PdfStorageUploader;
};

export type PdfStorageUploaderParams = {
  client: SupabaseClient;
  file: File;
  path: string;
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
};

export type PdfStorageUploader = (
  params: PdfStorageUploaderParams,
) => Promise<void>;

function getResumableUploadEndpoint() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Supabase URL is not configured");
  }

  const uploadUrl = new URL(supabaseUrl);

  if (uploadUrl.hostname.endsWith(".supabase.co")) {
    uploadUrl.hostname = uploadUrl.hostname.replace(
      /\.supabase\.co$/,
      ".storage.supabase.co",
    );
  }

  uploadUrl.pathname = "/storage/v1/upload/resumable";
  uploadUrl.search = "";
  uploadUrl.hash = "";

  return uploadUrl.toString();
}

async function getSupabaseAccessToken(client: SupabaseClient) {
  const sessionResult = await client.auth.getSession();
  const accessToken = sessionResult.data.session?.access_token;

  if (!accessToken) {
    throw new Error("Supabase session unavailable");
  }

  return accessToken;
}

export async function uploadPdfToStorageResumable({
  client,
  file,
  path,
  onProgress,
}: PdfStorageUploaderParams) {
  const accessToken = await getSupabaseAccessToken(client);
  const endpoint = getResumableUploadEndpoint();

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: PDF_STORAGE_BUCKET,
        objectName: path,
        contentType: file.type || "application/pdf",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024,
      onError: (error) => {
        reject(error);
      },
      onProgress,
      onSuccess: () => {
        resolve();
      },
    });

    void upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        upload.start();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function uploadPdfDocumentToCloud({
  client,
  ...input
}: UploadPdfDocumentToCloudParams) {
  const plan = buildPdfUploadPlan(input);

  if (!plan.withinQuota) {
    throw new Error("Storage quota exceeded");
  }

  const uploadFile = input.uploadFile ?? uploadPdfToStorageResumable;

  try {
    await uploadFile({
      client,
      file: input.file,
      path: plan.storagePath,
      onProgress: (uploadedBytes, totalBytes) => {
        input.onProgress?.(
          toUploadProgressPercent(uploadedBytes, totalBytes),
        );
      },
    });
  } catch (error) {
    throw new Error(
      `Supabase storage upload failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const metadataResult = await client
    .from("pdf_documents")
    .insert([mapPdfDocumentToCloudRow(plan.pdfDocument)]);

  if (metadataResult.error) {
    const cleanupResult = await client.storage
      .from(PDF_STORAGE_BUCKET)
      .remove([plan.storagePath]);

    if (cleanupResult.error) {
      console.warn(
        `Supabase storage cleanup failed after metadata insert error: ${cleanupResult.error.message}`,
      );
    }

    throw new Error(
      `Supabase metadata insert failed: ${metadataResult.error.message}`,
    );
  }

  return plan;
}
