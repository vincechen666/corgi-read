import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { PdfStage } from "@/components/reader/pdf-stage";

test("shows a page badge in the bottom-right corner instead of the top toolbar", async () => {
  render(
    <PdfStage
      documentName="lesson-3.pdf"
      error={null}
      source="blob:lesson-3"
      status="ready"
    />,
  );

  expect(screen.queryByText(/pdf\.js preview/i)).not.toBeInTheDocument();
  expect(await screen.findByText(/page 1 \/ 3/i)).toBeInTheDocument();
  expect(screen.queryByText(/115% zoom/i)).not.toBeInTheDocument();
});
