import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("react-pdf", () => ({
  Document: ({
    children,
    onLoadSuccess,
  }: {
    children: React.ReactNode;
    onLoadSuccess?: (document: { numPages: number }) => void;
  }) => {
    React.useEffect(() => {
      onLoadSuccess?.({ numPages: 3 });
    }, [onLoadSuccess]);

    return React.createElement("div", { "data-testid": "mock-pdf-document" }, children);
  },
  Page: ({ pageNumber }: { pageNumber?: number }) =>
    React.createElement(
      "div",
      { "data-testid": "mock-pdf-page" },
      `PDF page ${pageNumber ?? ""}`.trim(),
    ),
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: "",
    },
  },
}));
