import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { TopBar } from "@/components/reader/top-bar";

afterEach(() => {
  cleanup();
});

test("shows avatar entry for guests", () => {
  render(
    <TopBar
      documentLabel="未打开文档"
      isAuthenticated={false}
      menuOpen={false}
      onToggleMenu={vi.fn()}
      onUploadClick={vi.fn()}
    />,
  );

  expect(screen.getByRole("button", { name: /account/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /pdf library/i })).not.toBeInTheDocument();
});

test("shows pdf library trigger for authenticated users", () => {
  render(
    <TopBar
      documentLabel="lesson-1.pdf"
      isAuthenticated
      menuOpen={false}
      onToggleMenu={vi.fn()}
      onUploadClick={vi.fn()}
      onOpenLibrary={vi.fn()}
    />,
  );

  expect(screen.getByRole("button", { name: /account/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /pdf library/i })).toBeInTheDocument();
});
