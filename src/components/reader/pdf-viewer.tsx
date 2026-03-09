"use client";

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
  pageNumber,
  scale,
  onLoadSuccess,
}: PdfViewerProps) {
  function handleLoadSuccess(document: DocumentCallback) {
    onLoadSuccess(document.numPages);
  }

  return (
    <Document
      file={file}
      loading={<p className="text-sm text-[#8a8178]">Loading sample PDF…</p>}
      onLoadSuccess={handleLoadSuccess}
    >
      <Page
        pageNumber={pageNumber}
        renderAnnotationLayer={false}
        renderTextLayer
        scale={scale}
      />
    </Document>
  );
}
