import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const analysisClientMocks = vi.hoisted(() => ({
  transcribeAudio: vi.fn(),
  analyzeTranscript: vi.fn(),
}));

vi.mock("@/features/analysis/analysis-client", () => ({
  transcribeAudio: analysisClientMocks.transcribeAudio,
  analyzeTranscript: analysisClientMocks.analyzeTranscript,
}));

import { AppShell } from "@/components/reader/app-shell";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  window.localStorage.clear();
  analysisClientMocks.transcribeAudio.mockReset();
  analysisClientMocks.analyzeTranscript.mockReset();
});

async function uploadPdf(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /未打开文档/i }));
  await user.upload(
    screen.getByLabelText(/upload pdf input/i),
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );
}

test("shows a non-blocking audio processing bar after stopping recording and hides it after completion", async () => {
  const user = userEvent.setup();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  let resolveTranscription: ((value: {
    result: { transcript: string };
    meta: { mode: string; provider: string; model: string };
  }) => void) | null = null;

  analysisClientMocks.transcribeAudio.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveTranscription = resolve;
      }),
  );
  analysisClientMocks.analyzeTranscript.mockResolvedValue({
    result: {
      transcript: "People knew Multivac well.",
      corrected: "People knew Multivac well.",
      grammar: "语法正确。",
      nativeExpression: "beyond them",
      coachFeedback: "表达自然。",
    },
    meta: {
      mode: "mock",
      provider: "mock",
      model: "mock",
    },
  });

  render(<AppShell />);

  await uploadPdf(user);
  await user.click(screen.getByRole("button", { name: /start retelling/i }));
  await user.click(screen.getByRole("button", { name: /stop retelling/i }));

  const processingBar = await screen.findByTestId("audio-processing-progress");
  expect(processingBar).toHaveTextContent("AUDIO PROCESSING");
  expect(processingBar).toHaveTextContent("处理中");

  resolveTranscription?.({
    result: {
      transcript: "People knew Multivac well.",
    },
    meta: {
      mode: "mock",
      provider: "mock",
      model: "mock",
    },
  });

  await screen.findByText(/AI Retelling Feedback/i);
  await waitFor(() => {
    expect(
      screen.queryByTestId("audio-processing-progress"),
    ).not.toBeInTheDocument();
  });
});

test("hides the audio processing bar when transcription fails", async () => {
  const user = userEvent.setup();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  let rejectTranscription: ((reason?: unknown) => void) | null = null;

  analysisClientMocks.transcribeAudio.mockImplementation(
    () =>
      new Promise((_, reject) => {
        rejectTranscription = reject;
      }),
  );

  render(<AppShell />);

  await uploadPdf(user);
  await user.click(screen.getByRole("button", { name: /start retelling/i }));
  await user.click(screen.getByRole("button", { name: /stop retelling/i }));

  expect(await screen.findByTestId("audio-processing-progress")).toBeInTheDocument();

  rejectTranscription?.(new Error("Baidu transcription failed"));

  expect(await screen.findByText(/转写失败：Baidu transcription failed/i)).toBeInTheDocument();

  await waitFor(() => {
    expect(
      screen.queryByTestId("audio-processing-progress"),
    ).not.toBeInTheDocument();
  });
});
