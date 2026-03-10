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

  render(<PdfStage status="ready" />);

  fireEvent.mouseUp(screen.getByTestId("pdf-stage-viewer"));

  expect((await screen.findAllByText(/划词翻译/i)).at(-1)).toBeInTheDocument();
  expect(screen.getByText(/忠实看护者/i)).toBeInTheDocument();
});

test("shows a loading popover immediately while waiting for translation", async () => {
  translationClientMocks.translateSelection.mockImplementation(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            sourceText: "faithful attendants",
            translatedText: "忠实看护者",
            note: "短语释义",
          });
        }, 25);
      }),
  );
  mockSelection("faithful attendants");

  render(<PdfStage status="ready" />);

  fireEvent.mouseUp(screen.getByTestId("pdf-stage-viewer"));

  expect(await screen.findByText(/翻译中/i)).toBeInTheDocument();
  expect(await screen.findByText(/忠实看护者/i)).toBeInTheDocument();
});

test("keeps the translation popover visible after the click that completes text selection", async () => {
  translationClientMocks.translateSelection.mockResolvedValue({
    sourceText: "faithful attendants",
    translatedText: "忠实看护者",
    note: "短语释义",
  });
  mockSelection("faithful attendants");

  render(<PdfStage status="ready" />);

  const viewer = screen.getByTestId("pdf-stage-viewer");
  fireEvent.mouseUp(viewer);
  fireEvent.click(viewer);

  expect((await screen.findAllByText(/划词翻译/i)).at(-1)).toBeInTheDocument();
});

test("hides the translation popover when clicking outside the popover", async () => {
  translationClientMocks.translateSelection.mockResolvedValue({
    sourceText: "faithful attendants",
    translatedText: "忠实看护者",
    note: "短语释义",
  });
  mockSelection("faithful attendants");

  render(<PdfStage status="ready" />);

  fireEvent.mouseUp(screen.getByTestId("pdf-stage-viewer"));
  expect((await screen.findAllByText(/划词翻译/i)).at(-1)).toBeInTheDocument();

  fireEvent.click(document.body);

  await waitFor(() => {
    expect(screen.queryByText(/划词翻译/i)).not.toBeInTheDocument();
  });
});

test("does not reopen the popover when a pending translation resolves after dismiss", async () => {
  let resolveTranslation: ((value: {
    sourceText: string;
    translatedText: string;
    note: string;
  }) => void) | null = null;

  translationClientMocks.translateSelection.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveTranslation = resolve;
      }),
  );
  mockSelection("faithful attendants");

  render(<PdfStage status="ready" />);

  fireEvent.mouseUp(screen.getByTestId("pdf-stage-viewer"));
  expect(await screen.findByText(/翻译中/i)).toBeInTheDocument();

  fireEvent.click(document.body);

  await waitFor(() => {
    expect(screen.queryByText(/划词翻译/i)).not.toBeInTheDocument();
  });

  resolveTranslation?.({
    sourceText: "faithful attendants",
    translatedText: "忠实看护者",
    note: "短语释义",
  });

  await waitFor(() => {
    expect(screen.queryByText(/忠实看护者/i)).not.toBeInTheDocument();
  });
});
