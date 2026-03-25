import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { AppShell } from "@/components/reader/app-shell";
import { authStore } from "@/features/auth/auth-store";

vi.mock("@/features/analysis/analysis-client", () => ({
  analyzeTranscript: vi.fn(),
  transcribeAudio: vi.fn(),
}));

afterEach(() => {
  authStore.setState({
    session: { status: "guest", email: null },
  });
});

test("authenticated avatar does not open the login modal", () => {
  authStore.setState({
    session: { status: "authenticated", email: "reader@example.com" },
  });

  render(<AppShell />);

  fireEvent.click(screen.getByRole("button", { name: /account/i }));

  expect(
    screen.queryByText(/email verification/i),
  ).not.toBeInTheDocument();
});
