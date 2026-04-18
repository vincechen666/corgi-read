import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

const libraryClientMocks = vi.hoisted(() => ({
  uploadPdfDocumentToCloud: vi.fn(),
}));

vi.mock("@/features/library/library-client", () => ({
  uploadPdfDocumentToCloud: libraryClientMocks.uploadPdfDocumentToCloud,
}));

vi.mock("@/features/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({ client: "supabase-browser" })),
}));

vi.mock("@/features/analysis/analysis-client", () => ({
  transcribeAudio: vi.fn(),
  analyzeTranscript: vi.fn(),
}));

import { AppShell } from "@/components/reader/app-shell";
import { authStore } from "@/features/auth/auth-store";

afterEach(() => {
  cleanup();
  authStore.setState({
    session: {
      status: "guest",
    },
  });
  vi.restoreAllMocks();
  libraryClientMocks.uploadPdfDocumentToCloud.mockClear();
});

test("updates the reader when a local pdf is selected", async () => {
  const user = userEvent.setup();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getByRole("button", { name: /未打开文档/i }));
  const upload = screen.getAllByLabelText(/upload pdf input/i)[0];

  await user.upload(
    upload,
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );

  expect(await screen.findByText(/lesson-3\.pdf/i)).toBeInTheDocument();
  expect(libraryClientMocks.uploadPdfDocumentToCloud).not.toHaveBeenCalled();
});

test("keeps local reading available after an authenticated cloud upload failure", async () => {
  const user = userEvent.setup();
  let rejectUpload: ((reason?: unknown) => void) | null = null;
  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-123",
      email: "reader@example.com",
      storageQuotaBytes: 4096,
      storageUsedBytes: 1024,
    },
  });
  libraryClientMocks.uploadPdfDocumentToCloud.mockImplementationOnce(
    ({ onProgress }: { onProgress?: (percent: number) => void }) =>
      new Promise((_, reject) => {
        onProgress?.(55);
        rejectUpload = reject;
      }),
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getByRole("button", { name: /未打开文档/i }));
  const upload = screen.getByLabelText(/upload pdf input/i);

  await user.upload(
    upload,
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );

  expect(await screen.findByTestId("pdf-upload-progress")).toHaveTextContent(
    "55%",
  );

  rejectUpload?.(new Error("Supabase storage upload failed: boom"));

  await waitFor(() => {
    expect(screen.queryByTestId("pdf-upload-progress")).not.toBeInTheDocument();
  });
  expect(await screen.findByText(/PDF page 1/i)).toBeInTheDocument();
  expect(await screen.findByText(/lesson-3\.pdf/i)).toBeInTheDocument();
  expect(await screen.findByTestId("cloud-error-banner")).toHaveTextContent(
    "云端保存失败",
  );
});
