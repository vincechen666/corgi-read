import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

if (
  typeof window !== "undefined" &&
  typeof window.localStorage?.getItem !== "function"
) {
  const storage = new Map<string, string>();

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    },
  });
}

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

vi.mock("@/components/reader/epub-viewer", () => ({
  EpubViewer: ({
    documentName,
    onLoadSuccess,
  }: {
    documentName: string;
    onLoadSuccess?: (numPages: number) => void;
  }) => {
    React.useEffect(() => {
      onLoadSuccess?.(1);
    }, [onLoadSuccess]);

    return React.createElement(
      "div",
      {
        "data-epub-page-number": "1",
        "data-testid": "mock-epub-viewer",
      },
      `EPUB ${documentName}`,
    );
  },
}));
