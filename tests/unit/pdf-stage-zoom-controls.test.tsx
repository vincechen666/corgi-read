import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { PdfStage } from "@/components/reader/pdf-stage";

afterEach(() => {
  cleanup();
});

test("shows compact zoom controls in the top-right corner of the reader", async () => {
  render(
    <PdfStage
      documentName="lesson-3.pdf"
      error={null}
      source="blob:lesson-3"
      status="ready"
    />,
  );

  expect(await screen.findByText("115%")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
});

test("updates the zoom percentage when the controls are used", async () => {
  render(
    <PdfStage
      documentName="lesson-3.pdf"
      error={null}
      source="blob:lesson-3"
      status="ready"
    />,
  );

  fireEvent.click(await screen.findByRole("button", { name: /zoom in/i }));
  expect(screen.getByText("125%")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /zoom out/i }));
  expect(screen.getByText("115%")).toBeInTheDocument();
});

test("keeps the zoom level within the configured range", async () => {
  render(
    <PdfStage
      documentName="lesson-3.pdf"
      error={null}
      source="blob:lesson-3"
      status="ready"
    />,
  );

  const zoomOut = await screen.findByRole("button", { name: /zoom out/i });
  const zoomIn = screen.getByRole("button", { name: /zoom in/i });

  for (let count = 0; count < 10; count += 1) {
    fireEvent.click(zoomOut);
  }
  expect(screen.getByText("80%")).toBeInTheDocument();

  for (let count = 0; count < 20; count += 1) {
    fireEvent.click(zoomIn);
  }
  expect(screen.getByText("160%")).toBeInTheDocument();
});
