"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  analyzeTranscript,
  transcribeAudio,
} from "@/features/analysis/analysis-client";
import type {
  AnalysisResult,
  AnalysisRouteResponse,
} from "@/features/analysis/analysis-schema";
import { AnalysisModal } from "@/components/reader/analysis-modal";
import { LearningSidebar } from "@/components/reader/learning-sidebar";
import { PdfStage } from "@/components/reader/pdf-stage";
import { RecordingButton } from "@/components/reader/recording-button";
import { TopBar } from "@/components/reader/top-bar";
import { createPdfStageState } from "@/features/pdf/pdf-file-state";
import {
  hydrateSidebarStore,
  sidebarStore,
  useSidebarStore,
} from "@/features/sidebar/sidebar-store";

export function AppShell() {
  const addRecording = useSidebarStore((state) => state.addRecording);
  const addExpression = useSidebarStore((state) => state.addExpression);
  const [activeAnalysis, setActiveAnalysis] = useState<{
    recordingId: string;
    result: AnalysisResult;
  } | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null,
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [lastAudioBlob, setLastAudioBlob] = useState<Blob | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [pdfSource, setPdfSource] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState("未打开文档");
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [analysisMeta, setAnalysisMeta] = useState<AnalysisRouteResponse["meta"] | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (pdfSource?.startsWith("blob:")) {
        URL.revokeObjectURL(pdfSource);
      }
    };
  }, [pdfSource]);

  useEffect(() => {
    hydrateSidebarStore(sidebarStore);
  }, []);

  const pdfStageState = useMemo(
    () => createPdfStageState(pdfSource, isPdfLoading, readerError),
    [isPdfLoading, pdfSource, readerError],
  );

  const completeAnalysis = useCallback(
    async (transcript: string) => {
      const response = await analyzeTranscript(transcript);
      const recordingId = `recording-${Date.now()}`;

      addRecording({
        id: recordingId,
        createdAt: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date()),
        page: 12,
        summary: response.result.corrected,
        feedback: `AI 点评：${response.result.coachFeedback}`,
        analysis: response.result,
      });

      setAnalysisMeta(response.meta);
      setActiveAnalysis({
        recordingId,
        result: response.result,
      });
    },
    [addRecording],
  );

  const handleRecordingStop = useCallback(
    async (audioBlob: Blob | null) => {
      setLastAudioBlob(audioBlob);
      setTranscriptionError(null);
      setAnalysisError(null);

      let transcript: string;

      try {
        const transcription = await transcribeAudio(audioBlob);
        transcript = transcription.result.transcript;
      } catch (error) {
        setAnalysisMeta(null);
        setActiveAnalysis(null);
        const detail =
          error instanceof Error && error.message
            ? `转写失败：${error.message}`
            : "转写失败，可重试";
        setTranscriptionError(detail);
        throw new Error("transcription failed");
      }

      setLastTranscript(transcript);

      try {
        await completeAnalysis(transcript);
      } catch {
        setAnalysisMeta(null);
        setActiveAnalysis(null);
        setAnalysisError("分析失败，可重试");
        throw new Error("analysis failed");
      }
    },
    [completeAnalysis],
  );

  const handleOpenRecording = useCallback(
    (recording: { id: string; analysis?: AnalysisResult }) => {
      if (!recording.analysis) {
        return;
      }

      setActiveAnalysis({
        recordingId: recording.id,
        result: recording.analysis,
      });
    },
    [],
  );

  const handleAddExpression = useCallback(() => {
    if (!activeAnalysis) {
      return;
    }

    addExpression({
      id: `expression-${activeAnalysis.recordingId}`,
      phrase: activeAnalysis.result.nativeExpression,
      note: `${activeAnalysis.result.grammar} ${activeAnalysis.result.coachFeedback}`,
      sourceRecordingId: activeAnalysis.recordingId,
    });
    setActiveAnalysis(null);
  }, [activeAnalysis, addExpression]);

  const handleRetryAnalysis = useCallback(async () => {
    if (!lastTranscript) {
      return;
    }

    setAnalysisError(null);

    try {
      await completeAnalysis(lastTranscript);
    } catch {
      setAnalysisMeta(null);
      setActiveAnalysis(null);
      setAnalysisError("分析失败，可重试");
    }
  }, [completeAnalysis, lastTranscript]);

  const handleRetryTranscription = useCallback(async () => {
    setTranscriptionError(null);
    setAnalysisError(null);

    let transcript: string;

    try {
      const transcription = await transcribeAudio(lastAudioBlob);
      transcript = transcription.result.transcript;
    } catch (error) {
      setAnalysisMeta(null);
      setActiveAnalysis(null);
      const detail =
        error instanceof Error && error.message
          ? `转写失败：${error.message}`
          : "转写失败，可重试";
      setTranscriptionError(detail);
      return;
    }

    setLastTranscript(transcript);

    try {
      await completeAnalysis(transcript);
    } catch {
      setAnalysisMeta(null);
      setActiveAnalysis(null);
      setAnalysisError("分析失败，可重试");
    }
  }, [completeAnalysis, lastAudioBlob]);

  const handleToggleMenu = useCallback(() => {
    setMenuOpen((value) => !value);
  }, []);

  const handleUploadClick = useCallback(() => {
    setMenuOpen(false);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      event.target.value = "";

      if (!file) {
        return;
      }

      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setReaderError("Please choose a PDF file.");
        return;
      }

      setReaderError(null);
      setIsPdfLoading(true);
      setDocumentName(file.name);

      if (pdfSource?.startsWith("blob:")) {
        URL.revokeObjectURL(pdfSource);
      }

      const nextSource = URL.createObjectURL(file);
      setPdfSource(nextSource);

      await Promise.resolve();
      setIsPdfLoading(false);
    },
    [pdfSource],
  );

  return (
    <main
      className="h-screen overflow-hidden bg-[#f7f3ee] px-3 py-3 text-[#1a1a1a]"
      data-testid="app-shell"
    >
      <div className="mx-auto flex h-full max-w-[1500px] flex-col">
        <h1 className="sr-only">English PDF Reader</h1>
        <TopBar
          documentLabel={documentName}
          menuOpen={menuOpen}
          onToggleMenu={handleToggleMenu}
          onUploadClick={handleUploadClick}
        />
        <input
          ref={fileInputRef}
          accept="application/pdf,.pdf"
          aria-label="Upload PDF input"
          className="sr-only"
          onChange={handleFileChange}
          type="file"
        />

        <div
          className="relative mt-3 flex min-h-0 flex-1 gap-3"
          data-testid="workspace-shell"
        >
          <PdfStage
            documentName={documentName}
            error={pdfStageState.error}
            source={pdfStageState.source}
            status={pdfStageState.status}
          />
          <LearningSidebar onOpenRecording={handleOpenRecording} />
          <RecordingButton
            disabled={pdfStageState.status !== "ready"}
            onStop={handleRecordingStop}
          />
        </div>

        {transcriptionError || analysisError ? (
          <div className="pointer-events-none absolute left-1/2 top-[78px] z-20 flex w-full max-w-[680px] -translate-x-1/2 flex-col gap-2 px-2">
            {transcriptionError ? (
              <div className="pointer-events-auto flex items-center gap-3 border border-[#e7ded4] bg-[#fff7f0] px-4 py-3 text-sm text-[#7a4530] shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
                <p>{transcriptionError}</p>
                <button
                  className="bg-[#e07b54] px-4 py-2 font-semibold text-white"
                  onClick={() => {
                    void handleRetryTranscription();
                  }}
                  type="button"
                >
                  重新转写
                </button>
              </div>
            ) : null}

            {analysisError ? (
              <div className="pointer-events-auto flex items-center gap-3 border border-[#e7ded4] bg-[#fff7f0] px-4 py-3 text-sm text-[#7a4530] shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
                <p>{analysisError}</p>
                <button
                  className="bg-[#e07b54] px-4 py-2 font-semibold text-white"
                  onClick={() => {
                    void handleRetryAnalysis();
                  }}
                  type="button"
                >
                  重新分析
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <AnalysisModal
        open={Boolean(activeAnalysis)}
        onAddExpression={handleAddExpression}
        onClose={() => setActiveAnalysis(null)}
        result={activeAnalysis?.result ?? null}
      />

      {analysisMeta ? (
        <div className="pointer-events-none fixed bottom-3 right-3 border border-[#e7ded4] bg-[rgba(255,255,255,0.92)] px-3 py-2 text-[11px] font-mono tracking-[0.14em] text-[#6a625a] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
          {analysisMeta.provider} / {analysisMeta.mode}
        </div>
      ) : null}
    </main>
  );
}
