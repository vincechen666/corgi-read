"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";

import { PdfToolbar } from "@/components/reader/pdf-toolbar";
import { TranslationPopover } from "@/components/reader/translation-popover";
import { Card } from "@/components/ui/card";
import { normalizeSelectionText } from "@/features/pdf/pdf-selection";
import type { PdfTextSelection } from "@/features/pdf/pdf-types";
import {
  type TranslationResult,
  translationResultSchema,
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

type SelectionState = PdfTextSelection & {
  result: TranslationResult;
};

const FALLBACK_TRANSLATION = translationResultSchema.parse({
  sourceText: "deliberate translation moment",
  translatedText: "按需触发的翻译提示",
  note: "用户卡住时再看中文，避免阅读区长期双语并列。",
});

export function PdfStage() {
  const selectionRootRef = useRef<HTMLDivElement | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [selection, setSelection] = useState<SelectionState | null>({
    text: FALLBACK_TRANSLATION.sourceText,
    x: 596,
    y: 312,
    result: FALLBACK_TRANSLATION,
  });

  const zoom = 1.15;
  const zoomLabel = useMemo(() => `${Math.round(zoom * 100)}% zoom`, [zoom]);

  async function handleMouseUp() {
    const root = selectionRootRef.current;
    const browserSelection = window.getSelection();

    if (!root || !browserSelection || browserSelection.rangeCount === 0) {
      return;
    }

    const text = normalizeSelectionText(browserSelection.toString());
    if (!text) {
      return;
    }

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

        <div className="overflow-auto rounded-[20px] border border-[#e7ded4] bg-white px-6 py-8 shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
          <PdfViewer
            file="/sample/the-last-question.pdf"
            onLoadSuccess={setTotalPages}
            pageNumber={1}
            scale={zoom}
          />
        </div>

        {selection ? (
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
