import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { PdfStage } from "@/components/reader/pdf-stage";

const translationClientMocks = vi.hoisted(() => ({
  translateSelection: vi.fn(),
}));

vi.mock("@/features/translation/translation-client", () => ({
  translateSelection: translationClientMocks.translateSelection,
}));

afterEach(() => {
  cleanup();
  translationClientMocks.translateSelection.mockReset();
  vi.restoreAllMocks();
});

function mockSelection(text: string) {
  const rect = {
    left: 120,
    bottom: 220,
  };

  vi.spyOn(window, "getSelection").mockReturnValue({
    rangeCount: 1,
    toString: () => text,
    getRangeAt: () =>
      ({
        getBoundingClientRect: () => rect,
      }) as Range,
  } as Selection);
}

test("keeps the translation popover hidden on first render", () => {
  render(<PdfStage status="ready" />);

  expect(screen.queryByText(/划词翻译/i)).not.toBeInTheDocument();
});

test("shows the translation popover after selecting text in the reader", async () => {
  translationClientMocks.translateSelection.mockResolvedValue({
    sourceText: "faithful attendants",
    translatedText: "忠实看护者",
    note: "短语释义",
  });
  mockSelection("faithful attendants");

  const { container } = render(<PdfStage status="ready" />);

  fireEvent.mouseUp(container.querySelector("section section")!);

  expect((await screen.findAllByText(/划词翻译/i)).at(-1)).toBeInTheDocument();
  expect(screen.getByText(/忠实看护者/i)).toBeInTheDocument();
});

test("hides the translation popover when clicking outside the popover", async () => {
  translationClientMocks.translateSelection.mockResolvedValue({
    sourceText: "faithful attendants",
    translatedText: "忠实看护者",
    note: "短语释义",
  });
  mockSelection("faithful attendants");

  const { container } = render(<PdfStage status="ready" />);

  fireEvent.mouseUp(container.querySelector("section section")!);
  expect((await screen.findAllByText(/划词翻译/i)).at(-1)).toBeInTheDocument();

  fireEvent.click(document.body);

  await waitFor(() => {
    expect(screen.queryByText(/划词翻译/i)).not.toBeInTheDocument();
  });
});
