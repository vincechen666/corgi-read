import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("react-pdf", () => ({
  Document: ({ children }: { children: React.ReactNode }) => (
    React.createElement("div", { "data-testid": "mock-pdf-document" }, children)
  ),
  Page: () => React.createElement("div", { "data-testid": "mock-pdf-page" }, "PDF page"),
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: "",
    },
  },
}));
