import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { AuthModal } from "@/components/reader/auth-modal";
import {
  startEmailLoginCode,
  verifyEmailLoginCode,
} from "@/features/auth/auth-client";

vi.mock("@/features/auth/auth-client", () => ({
  startEmailLoginCode: vi.fn(),
  verifyEmailLoginCode: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.mocked(startEmailLoginCode).mockReset();
  vi.mocked(verifyEmailLoginCode).mockReset();
});

test("renders the email-entry state with email field and primary submit button", () => {
  render(<AuthModal open onClose={vi.fn()} />);

  expect(
    screen.getByRole("textbox", { name: /email address/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /send code/i }),
  ).toBeInTheDocument();
});

test("submits email, sends a login code, and switches to code entry", async () => {
  vi.mocked(startEmailLoginCode).mockResolvedValueOnce(undefined);

  render(<AuthModal open onClose={vi.fn()} />);

  fireEvent.change(screen.getByRole("textbox", { name: /email address/i }), {
    target: { value: "reader@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: /send code/i }));

  expect(
    await screen.findByRole("textbox", { name: /verification code/i }),
  ).toBeInTheDocument();
  expect(vi.mocked(startEmailLoginCode)).toHaveBeenCalledWith(
    "reader@example.com",
  );
});

test("verifies the login code from the code-entry state", async () => {
  vi.mocked(startEmailLoginCode).mockResolvedValueOnce(undefined);
  vi.mocked(verifyEmailLoginCode).mockResolvedValueOnce(undefined);

  render(<AuthModal open onClose={vi.fn()} />);

  fireEvent.change(screen.getByRole("textbox", { name: /email address/i }), {
    target: { value: "reader@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: /send code/i }));

  expect(
    await screen.findByRole("textbox", { name: /verification code/i }),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByRole("textbox", { name: /verification code/i }), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

  expect(vi.mocked(verifyEmailLoginCode)).toHaveBeenCalledWith(
    "reader@example.com",
    "123456",
  );
});

test("shows a verification error when code submission fails", async () => {
  vi.mocked(startEmailLoginCode).mockResolvedValueOnce(undefined);
  vi.mocked(verifyEmailLoginCode).mockRejectedValueOnce(new Error("boom"));

  render(<AuthModal open onClose={vi.fn()} />);

  fireEvent.change(screen.getByRole("textbox", { name: /email address/i }), {
    target: { value: "reader@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: /send code/i }));

  expect(
    await screen.findByRole("textbox", { name: /verification code/i }),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByRole("textbox", { name: /verification code/i }), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

  expect(await screen.findByText("boom")).toBeInTheDocument();
});

test("resends the login code from the code-entry state", async () => {
  vi.mocked(startEmailLoginCode).mockResolvedValue(undefined);

  render(<AuthModal open onClose={vi.fn()} />);

  fireEvent.change(screen.getByRole("textbox", { name: /email address/i }), {
    target: { value: "reader@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: /send code/i }));

  expect(await screen.findByRole("button", { name: /resend code/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /resend code/i }));

  expect(vi.mocked(startEmailLoginCode)).toHaveBeenCalledTimes(2);
  expect(vi.mocked(startEmailLoginCode)).toHaveBeenNthCalledWith(
    2,
    "reader@example.com",
  );
});

test("resets the form after closing and reopening", async () => {
  vi.mocked(startEmailLoginCode).mockResolvedValueOnce(undefined);

  const { rerender } = render(<AuthModal open onClose={vi.fn()} />);

  fireEvent.change(screen.getByRole("textbox", { name: /email address/i }), {
    target: { value: "reader@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: /send code/i }));

  expect(
    await screen.findByRole("textbox", { name: /verification code/i }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /close/i }));
  rerender(<AuthModal open={false} onClose={vi.fn()} />);
  rerender(<AuthModal open onClose={vi.fn()} />);

  expect(screen.getByRole("textbox", { name: /email address/i })).toHaveValue(
    "",
  );
  expect(
    screen.queryByRole("textbox", { name: /verification code/i }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/failed to send code/i)).not.toBeInTheDocument();
});
