export type PdfStageStatus = "empty" | "loading" | "ready" | "error";

export function normalizePdfDocumentLabel(fileName: string) {
  const trimmed = fileName.trim();

  return trimmed || "未命名 PDF";
}

export function createPdfStageState(
  source: string | null,
  isLoading: boolean,
  error: string | null,
) {
  if (error) {
    if (source) {
      return {
        status: "ready" as const,
        documentName: "已选中文档",
        source,
        error,
      };
    }

    return {
      status: "error" as const,
      documentName: "未打开文档",
      source: null,
      error,
    };
  }

  if (isLoading) {
    return {
      status: "loading" as const,
      documentName: source ? "正在载入文档" : "未打开文档",
      source,
      error: null,
    };
  }

  if (!source) {
    return {
      status: "empty" as const,
      documentName: "未打开文档",
      source: null,
      error: null,
    };
  }

  return {
    status: "ready" as const,
    documentName: "已选中文档",
    source,
    error: null,
  };
}
