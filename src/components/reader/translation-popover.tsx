"use client";

import type { TranslationResult } from "@/features/translation/translation-schema";
import { useSidebarStore } from "@/features/sidebar/sidebar-store";

type TranslationPopoverProps = {
  result: TranslationResult;
  x: number;
  y: number;
  sourcePage?: number;
};

export function TranslationPopover({
  result,
  x,
  y,
  sourcePage = 12,
}: TranslationPopoverProps) {
  const addFavorite = useSidebarStore((state) => state.addFavorite);

  return (
    <div
      data-translation-popover="true"
      className="absolute z-10 w-[264px] rounded-[20px] border border-[#e7ded4] bg-white p-[18px] shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
      style={{ left: x, top: y }}
    >
      <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
        划词翻译
      </p>
      <h3 className="mt-3 max-w-[228px] font-serif text-[18px] font-medium leading-[1.3] text-[#1a1a1a]">
        {result.sourceText}
      </h3>
      <p className="mt-2 max-w-[228px] text-base font-semibold leading-[1.35] text-[#0d6e6e]">
        {result.translatedText}
      </p>
      <p className="mt-2 max-w-[228px] text-[13px] leading-[1.45] text-[#6a625a]">
        {result.note}
      </p>
      <button
        type="button"
        className="mt-4 rounded-full bg-[#fff4ec] px-4 py-2 text-sm font-semibold text-[#c25b34]"
        onClick={() =>
          addFavorite({
            id: `${sourcePage}-${result.sourceText}`,
            sourceText: result.sourceText,
            translatedText: result.translatedText,
            type: "sentence",
            page: sourcePage,
          })
        }
      >
        收藏词句
      </button>
    </div>
  );
}
