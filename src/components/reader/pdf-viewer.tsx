"use client";

import { useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { DocumentCallback } from "react-pdf/dist/shared/types.js";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type PdfViewerProps = {
  file: string;
  scale: number;
  onLoadSuccess: (numPages: number) => void;
};

export function PdfViewer({
  file,
  scale,
  onLoadSuccess,
}: PdfViewerProps) {
  const [pageCount, setPageCount] = useState(0);
  const pages = useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index + 1),
    [pageCount],
  );

  function handleLoadSuccess(document: DocumentCallback) {
    setPageCount(document.numPages);
    onLoadSuccess(document.numPages);
  }

  return (
    <Document
      file={file}
      loading={<p className="text-sm text-[#8a8178]">Loading sample PDF…</p>}
      onLoadSuccess={handleLoadSuccess}
    >
      <div className="space-y-6">
        {pages.map((page) => (
          <div
            className="flex justify-center"
            key={page}
            data-pdf-page-number={page}
            data-testid="mock-pdf-page-wrapper"
          >
            <Page
              pageNumber={page}
              renderAnnotationLayer={false}
              renderTextLayer
              scale={scale}
            />
          </div>
        ))}
      </div>
    </Document>
  );
}
