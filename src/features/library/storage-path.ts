import {
  getDocumentExtension,
  type DocumentKind,
} from "@/features/document/document-types";

export function buildPdfStoragePath(
  userId: string,
  documentId: string,
  documentKind: DocumentKind = "pdf",
) {
  const extension = getDocumentExtension(documentKind);

  return `users/${userId}/${documentKind}/${documentId}.${extension}`;
}
