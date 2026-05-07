"use client";

import { useEffect, useRef } from "react";
import ePub, { type Book, type Rendition } from "epubjs";

type EpubViewerProps = {
  documentName: string;
  file: string;
  onLoadSuccess: (numPages: number) => void;
  scale: number;
};

export function EpubViewer({
  documentName,
  file,
  onLoadSuccess,
  scale,
}: EpubViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !file) {
      return;
    }

    const book: Book = ePub(file, { openAs: "epub" });
    const rendition = book.renderTo(container, {
      flow: "scrolled-doc",
      height: "100%",
      manager: "continuous",
      spread: "none",
      width: "100%",
    });

    renditionRef.current = rendition;
    rendition.themes.fontSize(`${Math.round(scale * 100)}%`);

    void rendition.display().then(() => {
      onLoadSuccess(1);
    });

    return () => {
      renditionRef.current = null;
      rendition.destroy();
      book.destroy();
      container.replaceChildren();
    };
  }, [file, onLoadSuccess, scale]);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${Math.round(scale * 100)}%`);
  }, [scale]);

  return (
    <div className="min-h-[70vh] bg-[#fffdf9] px-8 py-8">
      <div
        aria-label={`EPUB ${documentName}`}
        className="min-h-[70vh] text-[#1f1b17]"
        data-epub-page-number="1"
        data-testid="epub-viewer"
        ref={containerRef}
      />
    </div>
  );
}
