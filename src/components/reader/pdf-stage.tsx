"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { TranslationPopover } from "@/components/reader/translation-popover";
import { Card } from "@/components/ui/card";
import { normalizeSelectionText } from "@/features/pdf/pdf-selection";
import type { PdfTextSelection } from "@/features/pdf/pdf-types";
import {
  type TranslationResult,
} from "@/features/translation/translation-schema";
import { translateSelection } from "@/features/translation/translation-client";

const PdfViewer = dynamic(
  () =>
    import("@/components/reader/pdf-viewer").then((module) => module.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-[#8a8178]">Loading sample PDF…</p>
    ),
  },
);

type PdfViewerProps = {
  file: string;
  scale: number;
  onLoadSuccess: (numPages: number) => void;
};

function StaticPdfViewer({
  file,
  onLoadSuccess,
}: PdfViewerProps) {
  useEffect(() => {
    onLoadSuccess(1);
  }, [onLoadSuccess]);

  return (
    <div className="border border-[#e7ded4] bg-[#fcfbf8] p-6 text-[#514942]">
      <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
        STATIC PDF PREVIEW
      </p>
      <p className="mt-4 text-sm leading-7">
        Local PDF loaded for automated browser verification.
      </p>
      <p className="mt-2 text-xs text-[#8a8178]">{file}</p>
    </div>
  );
}

const ResolvedPdfViewer =
  process.env.NEXT_PUBLIC_E2E_STATIC_PDF === "1" ? StaticPdfViewer : PdfViewer;

type SelectionState = PdfTextSelection & {
  result: TranslationResult;
};

const loadingTranslationResult = (sourceText: string): TranslationResult => ({
  sourceText,
  translatedText: "翻译中…",
  note: "正在生成中文释义，请稍候。",
});

const failedTranslationResult = (sourceText: string): TranslationResult => ({
  sourceText,
  translatedText: "翻译失败",
  note: "当前翻译服务暂时不可用，请稍后重试。",
});

type PdfStageProps = {
  status?: "empty" | "loading" | "ready" | "error";
  documentName?: string;
  source?: string | null;
  error?: string | null;
};

export function PdfStage({
  status = "ready",
  documentName = "The Last Question.pdf",
  source = "/sample/the-last-question.pdf",
  error = null,
}: PdfStageProps) {
  const defaultZoom = 1.15;
  const minZoom = 0.8;
  const maxZoom = 1.6;
  const zoomStep = 0.1;
  const selectionRootRef = useRef<HTMLDivElement | null>(null);
  const ignoreDocumentClickRef = useRef(false);
  const clickResetTimerRef = useRef<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [zoom, setZoom] = useState(defaultZoom);

  function handleDocumentLoadSuccess(numPages: number) {
    setTotalPages(numPages);
    setCurrentPage(1);
  }

  function clearSelection() {
    setSelection(null);
  }

  function handleZoomOut() {
    setZoom((value) => Math.max(minZoom, Number((value - zoomStep).toFixed(2))));
  }

  function handleZoomIn() {
    setZoom((value) => Math.min(maxZoom, Number((value + zoomStep).toFixed(2))));
  }

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (ignoreDocumentClickRef.current) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        clearSelection();
        return;
      }

      if (target.closest("[data-translation-popover]")) {
        return;
      }

      clearSelection();
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);

      if (clickResetTimerRef.current !== null) {
        window.clearTimeout(clickResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const root = selectionRootRef.current;

    if (!root || status !== "ready") {
      return;
    }

    let frameId: number | null = null;

    function updateCurrentPage() {
      if (!root) {
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const pageNodes = Array.from(
        root.querySelectorAll<HTMLElement>("[data-pdf-page-number]"),
      );

      if (!pageNodes.length) {
        return;
      }

      let bestPage = 1;
      let bestVisibleHeight = -1;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const node of pageNodes) {
        const page = Number(node.dataset.pdfPageNumber);
        const rect = node.getBoundingClientRect();
        const visibleHeight = Math.max(
          0,
          Math.min(rect.bottom, rootRect.bottom) - Math.max(rect.top, rootRect.top),
        );
        const distance = Math.abs(rect.top - rootRect.top);

        if (
          visibleHeight > bestVisibleHeight ||
          (visibleHeight === bestVisibleHeight && distance < bestDistance)
        ) {
          bestPage = page;
          bestVisibleHeight = visibleHeight;
          bestDistance = distance;
        }
      }

      setCurrentPage(bestPage);
    }

    function handleScroll() {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        updateCurrentPage();
        frameId = null;
      });
    }

    updateCurrentPage();
    root.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      root.removeEventListener("scroll", handleScroll);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [status, totalPages, source]);

  async function handleMouseUp() {
    const root = selectionRootRef.current;

    if (!root) {
      clearSelection();
      return;
    }

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    const browserSelection = window.getSelection();

    if (!browserSelection || browserSelection.rangeCount === 0) {
      clearSelection();
      return;
    }

    const text = normalizeSelectionText(browserSelection.toString());
    if (!text) {
      clearSelection();
      return;
    }

    ignoreDocumentClickRef.current = true;
    if (clickResetTimerRef.current !== null) {
      window.clearTimeout(clickResetTimerRef.current);
    }
    clickResetTimerRef.current = window.setTimeout(() => {
      ignoreDocumentClickRef.current = false;
      clickResetTimerRef.current = null;
    }, 0);

    const rangeRect = browserSelection.getRangeAt(0).getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const x = rangeRect.left - rootRect.left + root.scrollLeft + 16;
    const y = rangeRect.bottom - rootRect.top + root.scrollTop + 16;

    setSelection({
      text,
      x,
      y,
      result: loadingTranslationResult(text),
    });

    try {
      const result = await translateSelection(text);

      setSelection((currentSelection) => {
        if (!currentSelection || currentSelection.text !== text) {
          return currentSelection;
        }

        return {
          ...currentSelection,
          result,
        };
      });
    } catch {
      setSelection((currentSelection) => {
        if (!currentSelection || currentSelection.text !== text) {
          return currentSelection;
        }

        return {
          ...currentSelection,
          result: failedTranslationResult(text),
        };
      });
    }
  }

  return (
    <Card
      className="relative flex h-full min-h-0 flex-1 overflow-hidden p-0"
      data-testid="pdf-stage-card"
    >
      <Card
        className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#fffdf9] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      >
        <div
          className="relative min-h-0 flex-1 overflow-auto px-3 py-3"
          data-testid="pdf-stage-viewer"
          onMouseUp={handleMouseUp}
          ref={selectionRootRef}
        >
          {status === "ready" && error ? (
            <div className="mb-3 border border-[#f0d4c7] bg-[#fff8f4] px-4 py-3 text-sm text-[#7a4530]">
              {error}
            </div>
          ) : null}

          {status === "empty" ? (
            <div className="flex min-h-full flex-col items-center justify-center border border-dashed border-[#dfd2c3] bg-white px-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
                EMPTY READER VIEW
              </p>
              <h3 className="mt-4 font-serif text-[34px] font-medium text-[#1a1a1a]">
                Upload a PDF to start reading
              </h3>
              <p className="mt-3 max-w-[520px] text-sm leading-7 text-[#6a625a]">
                点击右上角文档位，打开菜单后上传单个 PDF，在当前阅读页直接开始精读。
              </p>
            </div>
          ) : status === "loading" ? (
            <div className="flex min-h-full flex-col items-center justify-center border border-[#e7ded4] bg-white px-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
                LOADING PDF
              </p>
              <h3 className="mt-4 font-serif text-[28px] font-medium text-[#1a1a1a]">
                {documentName}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#6a625a]">
                Loading PDF…
              </p>
            </div>
          ) : status === "error" ? (
            <div className="flex min-h-full flex-col items-center justify-center border border-[#f0d4c7] bg-[#fff8f4] px-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#b26b4f]">
                PDF ERROR
              </p>
              <h3 className="mt-4 font-serif text-[28px] font-medium text-[#1a1a1a]">
                {documentName}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#7a4530]">
                {error}
              </p>
            </div>
          ) : (
            <div className="min-h-full border border-[#e7ded4] bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <ResolvedPdfViewer
                file={source ?? ""}
                onLoadSuccess={handleDocumentLoadSuccess}
                scale={zoom}
              />
            </div>
          )}

          {status === "ready" && selection ? (
            <TranslationPopover
              result={selection.result}
              x={selection.x}
              y={selection.y}
            />
          ) : null}
        </div>

        {status === "ready" ? (
          <div className="absolute right-3 top-3 z-10 flex items-center border border-[#e7ded4] bg-[rgba(255,255,255,0.92)] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
            <button
              aria-label="Zoom out"
              className="h-8 w-8 border-r border-[#e7ded4] text-[15px] text-[#6f675f]"
              onClick={handleZoomOut}
              type="button"
            >
              -
            </button>
            <div className="px-3 font-mono text-[11px] text-[#6f675f]">
              {Math.round(zoom * 100)}%
            </div>
            <button
              aria-label="Zoom in"
              className="h-8 w-8 border-l border-[#e7ded4] text-[15px] text-[#6f675f]"
              onClick={handleZoomIn}
              type="button"
            >
              +
            </button>
          </div>
        ) : null}

        {status === "ready" ? (
          <div className="pointer-events-none absolute bottom-3 right-3 border border-[#e7ded4] bg-[rgba(255,255,255,0.92)] px-3 py-2 font-mono text-[11px] text-[#6f675f] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
            Page {currentPage} / {totalPages}
          </div>
        ) : null}
      </Card>
    </Card>
  );
}
