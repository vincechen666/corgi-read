import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { PdfLibraryPanel } from "@/components/reader/pdf-library-panel";

afterEach(() => {
  cleanup();
});

test("renders pdf file metadata rows", () => {
  render(
    <PdfLibraryPanel
      documents={[
        {
          id: "doc-1",
          userId: "user-1",
          fileName: "lesson-1.pdf",
          fileSizeBytes: 2048,
          storagePath: "users/user-1/pdf/doc-1.pdf",
          createdAt: "2026-03-25T10:00:00.000Z",
        },
      ]}
      isOpen
      onClose={vi.fn()}
      onOpenDocument={vi.fn()}
    />,
  );

  const documentButton = screen.getByRole("button", { name: /lesson-1\.pdf/i });

  expect(documentButton).toBeInTheDocument();
  expect(documentButton).toHaveTextContent("2026-03-25 10:00");
  expect(documentButton).toHaveTextContent("2.0 KB");
});

test("closes when clicking the backdrop", () => {
  const onClose = vi.fn();

  render(
    <PdfLibraryPanel
      documents={[]}
      isOpen
      onClose={onClose}
      onOpenDocument={vi.fn()}
    />,
  );

  fireEvent.click(screen.getByTestId("pdf-library-backdrop"));

  expect(onClose).toHaveBeenCalledTimes(1);
});
