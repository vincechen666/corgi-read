import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

vi.mock("@/features/analysis/analysis-client", () => ({
  transcribeAudio: vi.fn(),
  analyzeTranscript: vi.fn(),
}));

import { AppShell } from "@/components/reader/app-shell";
import { authStore } from "@/features/auth/auth-store";

afterEach(() => {
  cleanup();
  authStore.setState({
    session: { status: "guest", userId: null, email: null },
  });
});

test("authenticated users can open and close the pdf library panel", async () => {
  const user = userEvent.setup();
  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-1",
      email: "reader@example.com",
    },
  });

  render(<AppShell />);

  await user.click(screen.getByRole("button", { name: /pdf library/i }));

  expect(screen.getByText("lesson-1.pdf")).toBeInTheDocument();

  await user.click(screen.getByTestId("pdf-library-backdrop"));

  expect(screen.queryByText("lesson-1.pdf")).not.toBeInTheDocument();
});

test("opening a library document updates the reading document label", async () => {
  const user = userEvent.setup();
  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-1",
      email: "reader@example.com",
    },
  });

  render(<AppShell />);

  await user.click(screen.getByTestId("pdf-library-trigger"));
  await user.click(screen.getByRole("button", { name: /lesson-1\.pdf/i }));

  expect(screen.queryByTestId("pdf-library-backdrop")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /lesson-1\.pdf/i }),
  ).toBeInTheDocument();
});
