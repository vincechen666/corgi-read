export type DocumentKind = "pdf" | "epub";

const DOCUMENT_EXTENSIONS: Record<DocumentKind, string> = {
  pdf: "pdf",
  epub: "epub",
};

export function getDocumentExtension(documentKind: DocumentKind) {
  return DOCUMENT_EXTENSIONS[documentKind];
}

export function getDocumentKindFromFile(file: File): DocumentKind | null {
  const lowerName = file.name.toLowerCase();

  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    return "pdf";
  }

  if (file.type === "application/epub+zip" || lowerName.endsWith(".epub")) {
    return "epub";
  }

  return null;
}

export function getDocumentKindFromName(fileName: string): DocumentKind {
  return fileName.toLowerCase().endsWith(".epub") ? "epub" : "pdf";
}

export function normalizeDocumentLabel(fileName: string) {
  const trimmed = fileName.trim();

  return trimmed || "未命名文档";
}
