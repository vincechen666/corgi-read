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
    .mockRejectedValueOnce(new Error("transcription failed"))
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

async function uploadPdf(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /未打开文档/i }));
  await user.upload(
    screen.getByLabelText(/upload pdf input/i),
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );
}

test("shows retry transcription state and retries with the same audio", async () => {
  const user = userEvent.setup();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await uploadPdf(user);
  await user.click(screen.getByRole("button", { name: /start retelling/i }));
  await user.click(screen.getByRole("button", { name: /stop retelling/i }));

  expect(await screen.findByText(/转写失败，可重试/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /重新转写/i }));

  expect(await screen.findByText(/AI Retelling Feedback/i)).toBeInTheDocument();
  expect(analysisClientMocks.analyzeTranscript).toHaveBeenCalledWith(
    "People knew Multivac well.",
  );
});
