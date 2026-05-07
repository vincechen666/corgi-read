import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { PdfStage } from "@/components/reader/pdf-stage";

test("renders the epub viewer when the active document is an epub", async () => {
  render(
    <PdfStage
      documentKind="epub"
      documentName="book.epub"
      error={null}
      source="blob:book"
      status="ready"
    />,
  );

  expect(await screen.findByTestId("mock-epub-viewer")).toHaveTextContent(
    "EPUB book.epub",
  );
  expect(screen.getByText("Page 1 / 1")).toBeInTheDocument();
});
