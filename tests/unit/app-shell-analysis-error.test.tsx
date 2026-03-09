import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/features/analysis/analysis-client", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({
    result: {
      transcript: "People knew Multivac well...",
    },
    meta: {
      mode: "mock",
      provider: "mock",
      model: "mock",
    },
  }),
  analyzeTranscript: vi.fn().mockRejectedValue(new Error("analysis failed")),
}));

import { AppShell } from "@/components/reader/app-shell";

beforeEach(() => {
  window.localStorage.clear();
});

async function uploadPdf(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /未打开文档/i }));
  await user.upload(
    screen.getByLabelText(/upload pdf input/i),
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );
}

test("shows retry feedback when analysis fails", async () => {
  const user = userEvent.setup();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await uploadPdf(user);
  await user.click(screen.getByRole("button", { name: /start retelling/i }));
  await user.click(screen.getByRole("button", { name: /stop retelling/i }));

  expect(await screen.findByText(/分析失败，可重试/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /重新分析/i })).toBeInTheDocument();
});
