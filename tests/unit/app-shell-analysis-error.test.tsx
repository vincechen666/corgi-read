import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/features/analysis/analysis-client", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({
    transcript: "People knew Multivac well...",
  }),
  analyzeTranscript: vi.fn().mockRejectedValue(new Error("analysis failed")),
}));

import { AppShell } from "@/components/reader/app-shell";

beforeEach(() => {
  window.localStorage.clear();
});

test("shows retry feedback when analysis fails", async () => {
  const user = userEvent.setup();

  render(<AppShell />);

  await user.click(screen.getByRole("button", { name: /start retelling/i }));
  await user.click(screen.getByRole("button", { name: /stop retelling/i }));

  expect(await screen.findByText(/分析失败，可重试/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /重新分析/i })).toBeInTheDocument();
});
