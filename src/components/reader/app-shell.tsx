"use client";

import { useCallback } from "react";

import {
  analyzeTranscript,
  transcribeAudio,
} from "@/features/analysis/analysis-client";
import { LearningSidebar } from "@/components/reader/learning-sidebar";
import { PdfStage } from "@/components/reader/pdf-stage";
import { RecordingButton } from "@/components/reader/recording-button";
import { TopBar } from "@/components/reader/top-bar";
import { useSidebarStore } from "@/features/sidebar/sidebar-store";

export function AppShell() {
  const addRecording = useSidebarStore((state) => state.addRecording);

  const handleRecordingStop = useCallback(
    async (audioBlob: Blob | null) => {
      const { transcript } = await transcribeAudio(audioBlob);
      const analysis = await analyzeTranscript(transcript);

      addRecording({
        id: `recording-${Date.now()}`,
        createdAt: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date()),
        page: 12,
        summary: analysis.corrected,
        feedback: `AI 点评：${analysis.coachFeedback}`,
      });
    },
    [addRecording],
  );

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-6 text-[#1a1a1a]">
      <div className="mx-auto max-w-[1500px]">
        <h1 className="sr-only">English PDF Reader</h1>
        <TopBar />

        <div className="relative mt-4 flex gap-5">
          <PdfStage />
          <LearningSidebar />
          <RecordingButton onStop={handleRecordingStop} />
        </div>
      </div>
    </main>
  );
}
