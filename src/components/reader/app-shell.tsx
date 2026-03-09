"use client";

import { useCallback, useState } from "react";

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
import { useSidebarStore } from "@/features/sidebar/sidebar-store";

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
  const [lastAudioBlob, setLastAudioBlob] = useState<Blob | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [analysisMeta, setAnalysisMeta] = useState<AnalysisRouteResponse["meta"] | null>(
    null,
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

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-6 text-[#1a1a1a]">
      <div className="mx-auto max-w-[1500px]">
        <h1 className="sr-only">English PDF Reader</h1>
        <TopBar />

        <div className="relative mt-4 flex gap-5">
          <PdfStage />
          <LearningSidebar onOpenRecording={handleOpenRecording} />
          <RecordingButton onStop={handleRecordingStop} />
        </div>

        {transcriptionError ? (
          <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-[#e7ded4] bg-[#fff7f0] px-5 py-4 text-sm text-[#7a4530]">
            <p>{transcriptionError}</p>
            <button
              className="rounded-full bg-[#e07b54] px-4 py-2 font-semibold text-white"
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
          <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-[#e7ded4] bg-[#fff7f0] px-5 py-4 text-sm text-[#7a4530]">
            <p>{analysisError}</p>
            <button
              className="rounded-full bg-[#e07b54] px-4 py-2 font-semibold text-white"
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

      <AnalysisModal
        open={Boolean(activeAnalysis)}
        onAddExpression={handleAddExpression}
        onClose={() => setActiveAnalysis(null)}
        result={activeAnalysis?.result ?? null}
      />

      {analysisMeta ? (
        <div className="pointer-events-none fixed bottom-6 right-6 rounded-full bg-[rgba(255,255,255,0.92)] px-4 py-2 text-xs font-mono tracking-[0.14em] text-[#6a625a] shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
          {analysisMeta.provider} / {analysisMeta.mode}
        </div>
      ) : null}
    </main>
  );
}
