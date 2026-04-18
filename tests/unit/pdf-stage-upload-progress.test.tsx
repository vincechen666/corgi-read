import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { PdfStage } from "@/components/reader/pdf-stage";

afterEach(() => {
  cleanup();
});

test("hides the upload progress bar by default", async () => {
  render(
    <PdfStage
      documentName="lesson-3.pdf"
      error={null}
      source="blob:lesson-3"
      status="ready"
    />,
  );

  await screen.findByText("115%");
  expect(screen.queryByTestId("pdf-upload-progress")).not.toBeInTheDocument();
});

test("renders the upload progress bar when a cloud upload is active", async () => {
  render(
    <PdfStage
      cloudUploadProgressPercent={42}
      documentName="lesson-3.pdf"
      error={null}
      isCloudUploadActive
      source="blob:lesson-3"
      status="ready"
    />,
  );

  expect(await screen.findByTestId("pdf-upload-progress")).toBeInTheDocument();
});

test("shows the expected upload percentage and width state", async () => {
  render(
    <PdfStage
      cloudUploadProgressPercent={42}
      documentName="lesson-3.pdf"
      error={null}
      isCloudUploadActive
      source="blob:lesson-3"
      status="ready"
    />,
  );

  const progress = await screen.findByTestId("pdf-upload-progress");

  expect(progress).toHaveTextContent("42%");
  expect(screen.getByTestId("pdf-upload-progress-fill")).toHaveStyle({
    width: "42%",
  });
});
