import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { PdfViewer } from "@/components/reader/pdf-viewer";

test("renders every page in the document for continuous scrolling", () => {
  const handleLoadSuccess = vi.fn();

  render(
    <PdfViewer
      file="/sample/the-last-question.pdf"
      onLoadSuccess={handleLoadSuccess}
      scale={1.15}
    />,
  );

  expect(handleLoadSuccess).toHaveBeenCalledWith(3);
  expect(screen.getAllByTestId("mock-pdf-page")).toHaveLength(3);
  expect(screen.getByText("PDF page 1")).toBeInTheDocument();
  expect(screen.getByText("PDF page 2")).toBeInTheDocument();
  expect(screen.getByText("PDF page 3")).toBeInTheDocument();
});

test("centers each rendered pdf page horizontally", () => {
  render(
    <PdfViewer
      file="/sample/the-last-question.pdf"
      onLoadSuccess={vi.fn()}
      scale={1.15}
    />,
  );

  const wrappers = screen.getAllByTestId("mock-pdf-page-wrapper");
  expect(wrappers[0]).toHaveClass("flex");
  expect(wrappers[0]).toHaveClass("justify-center");
});
