type PdfToolbarProps = {
  currentPage: number;
  totalPages: number;
  zoomLabel: string;
};

export function PdfToolbar({
  currentPage,
  totalPages,
  zoomLabel,
}: PdfToolbarProps) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-full bg-[#f8f4ee] px-4 py-3 text-sm text-[#6a625a]">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-white px-3 py-1 font-mono text-xs text-[#8a8178]">
          PDF.js Preview
        </span>
        <span>
          Page {currentPage} / {totalPages}
        </span>
      </div>
      <span className="font-mono text-xs text-[#8a8178]">{zoomLabel}</span>
    </div>
  );
}
