"use client";

import { useCallback, useState } from "react";

import {
  analyzeTranscript,
  transcribeAudio,
} from "@/features/analysis/analysis-client";
import type { AnalysisResult } from "@/features/analysis/analysis-schema";
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

  const handleRecordingStop = useCallback(
    async (audioBlob: Blob | null) => {
      const { transcript } = await transcribeAudio(audioBlob);
      const analysis = await analyzeTranscript(transcript);
      const recordingId = `recording-${Date.now()}`;

      addRecording({
        id: recordingId,
        createdAt: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date()),
        page: 12,
        summary: analysis.corrected,
        feedback: `AI 点评：${analysis.coachFeedback}`,
        analysis,
      });

      setActiveAnalysis({
        recordingId,
        result: analysis,
      });
    },
    [addRecording],
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
  }, [activeAnalysis, addExpression]);

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
      </div>

      <AnalysisModal
        open={Boolean(activeAnalysis)}
        onAddExpression={handleAddExpression}
        onClose={() => setActiveAnalysis(null)}
        result={activeAnalysis?.result ?? null}
      />
    </main>
  );
}
