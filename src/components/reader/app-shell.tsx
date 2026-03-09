import { LearningSidebar } from "@/components/reader/learning-sidebar";
import { PdfStage } from "@/components/reader/pdf-stage";
import { RecordingButton } from "@/components/reader/recording-button";
import { TopBar } from "@/components/reader/top-bar";

export function AppShell() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-6 text-[#1a1a1a]">
      <div className="mx-auto max-w-[1500px]">
        <TopBar />

        <div className="relative mt-4 flex gap-5">
          <PdfStage />
          <LearningSidebar />
          <RecordingButton />
        </div>
      </div>
    </main>
  );
}
