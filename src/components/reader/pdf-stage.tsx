"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { PdfToolbar } from "@/components/reader/pdf-toolbar";
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
  pageNumber: number;
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
    <div className="rounded-[18px] border border-[#e7ded4] bg-[#fcfbf8] p-8 text-[#514942]">
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
  const selectionRootRef = useRef<HTMLDivElement | null>(null);
  const ignoreDocumentClickRef = useRef(false);
  const clickResetTimerRef = useRef<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const zoom = 1.15;
  const zoomLabel = useMemo(() => `${Math.round(zoom * 100)}% zoom`, [zoom]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (ignoreDocumentClickRef.current) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        setSelection(null);
        return;
      }

      if (target.closest("[data-translation-popover]")) {
        return;
      }

      setSelection(null);
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);

      if (clickResetTimerRef.current !== null) {
        window.clearTimeout(clickResetTimerRef.current);
      }
    };
  }, []);

  async function handleMouseUp() {
    const root = selectionRootRef.current;
    const browserSelection = window.getSelection();

    if (!root || !browserSelection || browserSelection.rangeCount === 0) {
      setSelection(null);
      return;
    }

    const text = normalizeSelectionText(browserSelection.toString());
    if (!text) {
      setSelection(null);
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
    const x = rangeRect.left - rootRect.left + 16;
    const y = rangeRect.bottom - rootRect.top + 16;
    const result = await translateSelection(text);

    setSelection({
      text,
      x,
      y,
      result,
    });
  }

  return (
    <Card className="relative min-h-[760px] flex-1 p-9">
      <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
        READING WORKSPACE
      </p>
      <h2 className="mt-4 font-serif text-4xl font-medium text-[#1a1a1a]">
        Read in English. Ask for Chinese only when needed.
      </h2>

      <Card
        className="relative mt-10 min-h-[670px] w-full bg-[#fffdf9] px-8 py-10 shadow-[0_6px_16px_rgba(0,0,0,0.04)]"
        ref={selectionRootRef}
        onMouseUp={handleMouseUp}
      >
        <PdfToolbar currentPage={1} totalPages={totalPages} zoomLabel={zoomLabel} />

        {status === "ready" && error ? (
          <div className="mb-6 rounded-[18px] border border-[#f0d4c7] bg-[#fff8f4] px-5 py-4 text-sm text-[#7a4530]">
            {error}
          </div>
        ) : null}

        {status === "empty" ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#dfd2c3] bg-white px-10 text-center shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
              EMPTY READER VIEW
            </p>
            <h3 className="mt-5 font-serif text-[34px] font-medium text-[#1a1a1a]">
              Upload a PDF to start reading
            </h3>
            <p className="mt-4 max-w-[520px] text-sm leading-7 text-[#6a625a]">
              点击右上角文档位，打开菜单后上传单个 PDF，在当前阅读页直接开始精读。
            </p>
          </div>
        ) : status === "loading" ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[20px] border border-[#e7ded4] bg-white px-10 text-center shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
              LOADING PDF
            </p>
            <h3 className="mt-5 font-serif text-[28px] font-medium text-[#1a1a1a]">
              {documentName}
            </h3>
            <p className="mt-4 text-sm leading-7 text-[#6a625a]">
              Loading PDF…
            </p>
          </div>
        ) : status === "error" ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[20px] border border-[#f0d4c7] bg-[#fff8f4] px-10 text-center shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#b26b4f]">
              PDF ERROR
            </p>
            <h3 className="mt-5 font-serif text-[28px] font-medium text-[#1a1a1a]">
              {documentName}
            </h3>
            <p className="mt-4 text-sm leading-7 text-[#7a4530]">
              {error}
            </p>
          </div>
        ) : (
          <div className="overflow-auto rounded-[20px] border border-[#e7ded4] bg-white px-6 py-8 shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
            <ResolvedPdfViewer
              file={source ?? ""}
              onLoadSuccess={setTotalPages}
              pageNumber={1}
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
      </Card>
    </Card>
  );
}
