export type PdfLibraryDocument = {
  createdAt: string;
  fileName: string;
  fileSizeBytes: number;
  id: string;
  previewSource?: string;
  storagePath?: string;
  userId?: string;
};

type PdfLibraryPanelProps = {
  documents: PdfLibraryDocument[];
  isOpen: boolean;
  onClose: () => void;
  onOpenDocument: (document: PdfLibraryDocument) => void;
};

function formatFileSize(fileSizeBytes: number) {
  if (fileSizeBytes < 1024) {
    return `${fileSizeBytes.toFixed(0)} B`;
  }

  if (fileSizeBytes < 1024 * 1024) {
    return `${(fileSizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(isoTimestamp: string) {
  const date = new Date(isoTimestamp);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  const hour = `${date.getUTCHours()}`.padStart(2, "0");
  const minute = `${date.getUTCMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function PdfLibraryPanel({
  documents,
  isOpen,
  onClose,
  onOpenDocument,
}: PdfLibraryPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40">
      <button
        aria-label="Close PDF library"
        className="absolute inset-0 bg-[rgba(26,26,26,0.24)]"
        data-testid="pdf-library-backdrop"
        onClick={onClose}
        type="button"
      />

      <aside className="absolute left-3 top-3 z-10 flex h-[calc(100vh-1.5rem)] w-[360px] flex-col border border-[#e7ded4] bg-[#f8f4ee] shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
        <div className="border-b border-[#e7ded4] px-4 py-4">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
            PDF 库
          </p>
          <p className="mt-2 text-[14px] text-[#514942]">
            已上传的 PDF 将显示在这里
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {documents.length ? (
            <div className="space-y-2">
              {documents.map((document) => (
                <button
                  key={document.id}
                  className="w-full border border-[#e7ded4] bg-white px-4 py-3 text-left transition-colors hover:bg-[#f8f4ee]"
                  onClick={() => onOpenDocument(document)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-[#1a1a1a]">
                        {document.fileName}
                      </p>
                      <p className="mt-1 text-[12px] text-[#8a8178]">
                        {formatTimestamp(document.createdAt)} ·{" "}
                        {formatFileSize(document.fileSizeBytes)}
                      </p>
                    </div>
                    <span className="mt-0.5 text-[11px] font-semibold tracking-[0.16em] text-[#c25b34]">
                      打开
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center px-6 py-10 text-center">
              <div>
                <p className="text-[15px] font-medium text-[#1a1a1a]">
                  暂无 PDF
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[#8a8178]">
                  上传文件后，它们会出现在这个列表里。
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
