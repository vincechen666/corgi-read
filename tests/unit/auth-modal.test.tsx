import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { AuthModal } from "@/components/reader/auth-modal";
import { startEmailSignupLink } from "@/features/auth/auth-client";

vi.mock("@/features/auth/auth-client", () => ({
  startEmailSignupLink: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.mocked(startEmailSignupLink).mockReset();
});

test("resets the form after closing and reopening", async () => {
  vi.mocked(startEmailSignupLink).mockResolvedValueOnce(undefined);

  const { rerender } = render(
    <AuthModal open onClose={vi.fn()} />,
  );

  fireEvent.change(screen.getByRole("textbox", { name: /email address/i }), {
    target: { value: "reader@example.com" },
  });
  fireEvent.submit(screen.getByRole("button", { name: /send link/i }));

  expect(
    await screen.findByText(/verification email sent/i),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /close/i }));
  rerender(<AuthModal open={false} onClose={vi.fn()} />);
  rerender(<AuthModal open onClose={vi.fn()} />);

  expect(screen.getByRole("textbox", { name: /email address/i })).toHaveValue(
    "",
  );
  expect(
    screen.queryByText(/verification email sent/i),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/failed to start login/i)).not.toBeInTheDocument();
});

test("resets the error after closing and reopening", async () => {
  vi.mocked(startEmailSignupLink).mockRejectedValueOnce(new Error("boom"));

  const { rerender } = render(
    <AuthModal open onClose={vi.fn()} />,
  );

  fireEvent.change(screen.getByRole("textbox", { name: /email address/i }), {
    target: { value: "reader@example.com" },
  });
  fireEvent.submit(screen.getByRole("button", { name: /send link/i }));

  expect(await screen.findByText("boom")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /close/i }));
  rerender(<AuthModal open={false} onClose={vi.fn()} />);
  rerender(<AuthModal open onClose={vi.fn()} />);

  expect(screen.getByRole("textbox", { name: /email address/i })).toHaveValue(
    "",
  );
  expect(screen.queryByText("boom")).not.toBeInTheDocument();
});
