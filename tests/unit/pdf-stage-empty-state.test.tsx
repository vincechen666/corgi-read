import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { PdfStage } from "@/components/reader/pdf-stage";

test("shows empty state when no pdf source is available", () => {
  render(
    <PdfStage
      documentName="未打开文档"
      error={null}
      source={null}
      status="empty"
    />,
  );

  expect(
    screen.getByText(/upload a pdf to start reading/i),
  ).toBeInTheDocument();
});

test("shows loading state while a selected pdf is being prepared", () => {
  render(
    <PdfStage
      documentName="lesson-3.pdf"
      error={null}
      source={null}
      status="loading"
    />,
  );

  expect(screen.getByText("Loading PDF…")).toBeInTheDocument();
});
