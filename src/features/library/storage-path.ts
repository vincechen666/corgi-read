export function buildPdfStoragePath(userId: string, documentId: string) {
  return `users/${userId}/pdf/${documentId}.pdf`;
}
