export type PdfDocumentMeta = {
  fileName: string;
  totalPages: number;
  currentPage: number;
  zoom: number;
};

export type PdfTextSelection = {
  text: string;
  x: number;
  y: number;
};
