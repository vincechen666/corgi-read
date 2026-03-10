import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";

import { PdfStage } from "@/components/reader/pdf-stage";

function mockRect(element: Element, rect: Partial<DOMRect>) {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () =>
      ({
        x: 0,
        y: rect.top ?? 0,
        width: 400,
        height: (rect.bottom ?? 0) - (rect.top ?? 0),
        top: rect.top ?? 0,
        right: rect.right ?? 400,
        bottom: rect.bottom ?? 0,
        left: rect.left ?? 0,
        toJSON: () => rect,
      }) as DOMRect,
  });
}

test("updates the page badge as the reader scrolls through the document", async () => {
  render(
    <PdfStage
      documentName="lesson-3.pdf"
      error={null}
      source="blob:lesson-3"
      status="ready"
    />,
  );

  const viewer = screen.getByTestId("pdf-stage-viewer");
  const pages = await screen.findAllByTestId("mock-pdf-page-wrapper");

  mockRect(viewer, { top: 0, bottom: 600 });
  mockRect(pages[0], { top: 0, bottom: 520 });
  mockRect(pages[1], { top: 540, bottom: 1060 });
  mockRect(pages[2], { top: 1080, bottom: 1600 });

  fireEvent.scroll(viewer);
  expect(await screen.findByText(/page 1 \/ 3/i)).toBeInTheDocument();

  mockRect(pages[0], { top: -500, bottom: 20 });
  mockRect(pages[1], { top: 40, bottom: 560 });
  mockRect(pages[2], { top: 580, bottom: 1100 });

  fireEvent.scroll(viewer);

  await waitFor(() => {
    expect(screen.getByText(/page 2 \/ 3/i)).toBeInTheDocument();
  });
});
