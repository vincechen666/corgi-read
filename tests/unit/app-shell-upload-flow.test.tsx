import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

const libraryClientMocks = vi.hoisted(() => ({
  uploadPdfDocumentToCloud: vi.fn(),
}));

vi.mock("@/features/library/library-client", () => ({
  uploadPdfDocumentToCloud: libraryClientMocks.uploadPdfDocumentToCloud,
}));

import { AppShell } from "@/components/reader/app-shell";

afterEach(() => {
  vi.restoreAllMocks();
  libraryClientMocks.uploadPdfDocumentToCloud.mockClear();
});

test("updates the reader when a local pdf is selected", async () => {
  const user = userEvent.setup();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getByRole("button", { name: /未打开文档/i }));
  const upload = screen.getByLabelText(/upload pdf input/i);

  await user.upload(
    upload,
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );

  expect(await screen.findByText(/lesson-3\.pdf/i)).toBeInTheDocument();
  expect(libraryClientMocks.uploadPdfDocumentToCloud).not.toHaveBeenCalled();
});
