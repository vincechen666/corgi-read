import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

const analysisClientMocks = vi.hoisted(() => ({
  transcribeAudio: vi.fn(),
  analyzeTranscript: vi.fn(),
}));

vi.mock("@/features/analysis/analysis-client", () => ({
  transcribeAudio: analysisClientMocks.transcribeAudio,
  analyzeTranscript: analysisClientMocks.analyzeTranscript,
}));

import { AppShell } from "@/components/reader/app-shell";

beforeEach(() => {
  window.localStorage.clear();
  analysisClientMocks.transcribeAudio.mockReset();
  analysisClientMocks.analyzeTranscript.mockReset();
  analysisClientMocks.transcribeAudio
    .mockRejectedValueOnce(
      new Error("Baidu transcription failed: 3302 No permission to access data"),
    )
    .mockResolvedValueOnce({
      result: {
        transcript: "People knew Multivac well.",
      },
      meta: {
        mode: "mock",
        provider: "mock",
        model: "mock",
      },
    });
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
});

test("shows retry transcription state and retries with the same audio", async () => {
  const user = userEvent.setup();

  render(<AppShell />);

  await user.click(screen.getByRole("button", { name: /start retelling/i }));
  await user.click(screen.getByRole("button", { name: /stop retelling/i }));

  expect(
    await screen.findByText(/转写失败：Baidu transcription failed: 3302/i),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /重新转写/i }));

  expect(await screen.findByText(/AI Retelling Feedback/i)).toBeInTheDocument();
  expect(analysisClientMocks.analyzeTranscript).toHaveBeenCalledWith(
    "People knew Multivac well.",
  );
});
