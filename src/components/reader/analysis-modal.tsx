"use client";

import type { AnalysisResult } from "@/features/analysis/analysis-schema";

type AnalysisModalProps = {
  open: boolean;
  result: AnalysisResult | null;
  onClose: () => void;
  onAddExpression?: () => void;
};

function Section({
  label,
  content,
}: {
  label: string;
  content: string;
}) {
  return (
    <section className="border border-[#ece3d9] bg-[#fcfaf7] p-4">
      <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
        {label}
      </p>
      <p className="mt-2 text-[14px] leading-6 text-[#2d2926]">{content}</p>
    </section>
  );
}

export function AnalysisModal({
  open,
  result,
  onClose,
  onAddExpression,
}: AnalysisModalProps) {
  if (!open || !result) {
    return null;
  }

  return (
    <div
      aria-hidden={false}
      className="fixed inset-0 z-20 bg-[rgba(26,26,26,0.28)] px-4 py-6 backdrop-blur-[2px]"
      data-testid="analysis-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-labelledby="analysis-modal-title"
        aria-modal="true"
        className="mx-auto flex max-h-[calc(100vh-3rem)] max-w-[540px] flex-col overflow-y-auto border border-[#e7ded4] bg-[#fffdf9] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
              FEEDBACK VIEW
            </p>
            <h2
              className="mt-2 font-serif text-[34px] font-medium text-[#1a1a1a]"
              id="analysis-modal-title"
            >
              AI Retelling Feedback
            </h2>
            <p className="mt-2 max-w-[460px] text-sm leading-6 text-[#6a625a]">
              先看自己说了什么，再看更自然的表达和语法提醒。
            </p>
          </div>

          <button
            aria-label="Close analysis"
            className="border border-[#e7ded4] px-4 py-2 text-sm font-semibold text-[#6a625a]"
            onClick={onClose}
            type="button"
          >
            关闭
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <Section content={result.transcript} label="YOUR RETELLING" />
          <Section content={result.corrected} label="CORRECTED VERSION" />
          <Section content={result.grammar} label="GRAMMAR NOTE" />
          <Section content={result.nativeExpression} label="NATIVE EXPRESSION" />
          <Section content={result.coachFeedback} label="AI COACH" />
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            className="border border-[#d4e7e1] bg-[#eef6f3] px-5 py-3 text-sm font-semibold text-[#0d6e6e]"
            onClick={onAddExpression}
            type="button"
          >
            加入表达库
          </button>
          <button
            className="bg-[#e07b54] px-5 py-3 text-sm font-semibold text-white"
            onClick={onClose}
            type="button"
          >
            返回阅读
          </button>
        </div>
      </div>
    </div>
  );
}
