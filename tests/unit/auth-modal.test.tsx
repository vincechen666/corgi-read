import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { AppShell } from "@/components/reader/app-shell";

vi.mock("@/features/analysis/analysis-client", () => ({
  analyzeTranscript: vi.fn(),
  transcribeAudio: vi.fn(),
}));

test("opens login modal from guest user entry", () => {
  render(<AppShell />);

  fireEvent.click(screen.getByRole("button", { name: /account/i }));

  expect(screen.getByText(/email verification/i)).toBeInTheDocument();
});
