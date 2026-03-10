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
  pageNumber: number;
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
          <Page
            key={page}
            pageNumber={page}
            renderAnnotationLayer={false}
            renderTextLayer
            scale={scale}
          />
        ))}
      </div>
    </Document>
  );
}
