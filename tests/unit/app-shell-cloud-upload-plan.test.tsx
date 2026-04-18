import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

const libraryClientMocks = vi.hoisted(() => ({
  loadPdfLibraryDocuments: vi.fn(async () => []),
  uploadPdfDocumentToCloud: vi.fn(async () => ({
    documentId: "doc-1",
    storagePath: "users/user-123/pdf/doc-1.pdf",
    pdfDocument: {
      id: "doc-1",
      userId: "user-123",
      fileName: "lesson-3.pdf",
      fileSizeBytes: 3,
      storagePath: "users/user-123/pdf/doc-1.pdf",
      createdAt: "2026-03-25T10:00:00.000Z",
    },
    withinQuota: true,
  })),
}));

vi.mock("@/features/library/library-client", () => ({
  loadPdfLibraryDocuments: libraryClientMocks.loadPdfLibraryDocuments,
  uploadPdfDocumentToCloud: libraryClientMocks.uploadPdfDocumentToCloud,
}));

vi.mock("@/features/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    client: "supabase-browser",
    from: vi.fn(),
    storage: { from: vi.fn() },
  })),
}));

vi.mock("@/features/analysis/analysis-client", () => ({
  transcribeAudio: vi.fn(),
  analyzeTranscript: vi.fn(),
}));

import { AppShell } from "@/components/reader/app-shell";
import { authStore } from "@/features/auth/auth-store";

beforeEach(() => {
  window.localStorage.clear();
  libraryClientMocks.uploadPdfDocumentToCloud.mockClear();
  libraryClientMocks.loadPdfLibraryDocuments.mockClear();
  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-123",
      email: "reader@example.com",
      storageQuotaBytes: 4096,
      storageUsedBytes: 1024,
    },
  });
});

test("authenticated uploads call the cloud upload service with the canonical user id", async () => {
  const user = userEvent.setup();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getAllByRole("button", { name: /未打开文档/i })[0]);
  const uploadInput = screen.getAllByLabelText(/upload pdf input/i)[0];
  await user.upload(
    uploadInput,
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );

  expect(libraryClientMocks.uploadPdfDocumentToCloud).toHaveBeenCalledWith(
    expect.objectContaining({
      client: expect.objectContaining({
        client: "supabase-browser",
      }),
      file: expect.any(File),
      onProgress: expect.any(Function),
      storageQuotaBytes: 4096,
      storageUsedBytes: 1024,
      userId: "user-123",
    }),
  );
  expect(await screen.findByText(/lesson-3\.pdf/i)).toBeInTheDocument();
});

test("authenticated uploads surface quota exceeded from the cloud upload service", async () => {
  const user = userEvent.setup();
  libraryClientMocks.uploadPdfDocumentToCloud.mockRejectedValueOnce(
    new Error("Storage quota exceeded"),
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getAllByRole("button", { name: /未打开文档/i })[0]);
  const uploadInput = screen.getAllByLabelText(/upload pdf input/i)[0];
  await user.upload(
    uploadInput,
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );

  expect(await screen.findByText(/PDF page 1/i)).toBeInTheDocument();
  expect(
    await screen.findByText(/已达到 1 GB 空间上限/i),
  ).toBeInTheDocument();
  expect(libraryClientMocks.uploadPdfDocumentToCloud).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: "user-123",
      storageQuotaBytes: 4096,
      storageUsedBytes: 1024,
    }),
  );
});

test("authenticated uploads display cloud upload progress", async () => {
  const user = userEvent.setup();
  let resolveUpload: (() => void) | null = null;
  libraryClientMocks.uploadPdfDocumentToCloud.mockImplementationOnce(
    ({ onProgress }: { onProgress?: (percent: number) => void }) =>
      new Promise((resolve) => {
        onProgress?.(45);
        resolveUpload = () => resolve({
          documentId: "doc-1",
          storagePath: "users/user-123/pdf/doc-1.pdf",
          pdfDocument: {
            id: "doc-1",
            userId: "user-123",
            fileName: "lesson-3.pdf",
            fileSizeBytes: 3,
            storagePath: "users/user-123/pdf/doc-1.pdf",
            createdAt: "2026-03-25T10:00:00.000Z",
          },
          withinQuota: true,
        });
      }),
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getAllByRole("button", { name: /未打开文档/i })[0]);
  const uploadInput = screen.getAllByLabelText(/upload pdf input/i)[0];
  await user.upload(
    uploadInput,
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );

  expect(await screen.findByText(/45%/i)).toBeInTheDocument();
  resolveUpload?.();
});

test("authenticated upload progress reaches completion and then hides", async () => {
  const user = userEvent.setup();
  let resolveUpload: (() => void) | null = null;
  libraryClientMocks.uploadPdfDocumentToCloud.mockImplementationOnce(
    ({ onProgress }: { onProgress?: (percent: number) => void }) =>
      new Promise((resolve) => {
        onProgress?.(100);
        resolveUpload = () => resolve({
          documentId: "doc-1",
          storagePath: "users/user-123/pdf/doc-1.pdf",
          pdfDocument: {
            id: "doc-1",
            userId: "user-123",
            fileName: "lesson-3.pdf",
            fileSizeBytes: 3,
            storagePath: "users/user-123/pdf/doc-1.pdf",
            createdAt: "2026-03-25T10:00:00.000Z",
          },
          withinQuota: true,
        });
      }),
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getAllByRole("button", { name: /未打开文档/i })[0]);
  const uploadInput = screen.getAllByLabelText(/upload pdf input/i)[0];
  await user.upload(
    uploadInput,
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );

  expect(await screen.findByText(/100%/i)).toBeInTheDocument();

  resolveUpload?.();

  await waitFor(() => {
    expect(screen.queryByTestId("pdf-upload-progress")).not.toBeInTheDocument();
  });
});

test("guest uploads never show cloud upload progress", async () => {
  const user = userEvent.setup();
  authStore.setState({
    session: {
      status: "guest",
    },
  });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getAllByRole("button", { name: /未打开文档/i })[0]);
  const uploadInput = screen.getAllByLabelText(/upload pdf input/i)[0];
  await user.upload(
    uploadInput,
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );

  expect(await screen.findByText(/PDF page 1/i)).toBeInTheDocument();
  expect(screen.queryByTestId("pdf-upload-progress")).not.toBeInTheDocument();
  expect(libraryClientMocks.uploadPdfDocumentToCloud).not.toHaveBeenCalled();
});

test("authenticated repeated uploads use the updated in-session storage usage", async () => {
  const user = userEvent.setup();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getAllByRole("button", { name: /未打开文档/i })[0]);
  let uploadInput = screen.getAllByLabelText(/upload pdf input/i)[0];
  await user.upload(
    uploadInput,
    new File([new Uint8Array(400)], "lesson-3.pdf", { type: "application/pdf" }),
  );

  await waitFor(() =>
    expect(libraryClientMocks.uploadPdfDocumentToCloud).toHaveBeenCalledTimes(
      1,
    ),
  );

  expect(libraryClientMocks.uploadPdfDocumentToCloud).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      userId: "user-123",
      storageQuotaBytes: 4096,
      storageUsedBytes: 1024,
    }),
  );

  libraryClientMocks.uploadPdfDocumentToCloud.mockResolvedValueOnce({
    documentId: "doc-2",
    storagePath: "users/user-123/pdf/doc-2.pdf",
    pdfDocument: {
      id: "doc-2",
      userId: "user-123",
      fileName: "lesson-4.pdf",
      fileSizeBytes: 500,
      storagePath: "users/user-123/pdf/doc-2.pdf",
      createdAt: "2026-03-25T10:01:00.000Z",
    },
    withinQuota: true,
  });

  await user.click(screen.getAllByRole("button", { name: /lesson-3\.pdf/i })[0]);
  uploadInput = screen.getAllByLabelText(/upload pdf input/i)[0];
  await user.upload(
    uploadInput,
    new File([new Uint8Array(500)], "lesson-4.pdf", { type: "application/pdf" }),
  );

  await waitFor(() =>
    expect(libraryClientMocks.uploadPdfDocumentToCloud).toHaveBeenCalledTimes(
      2,
    ),
  );

  expect(libraryClientMocks.uploadPdfDocumentToCloud).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      userId: "user-123",
      storageQuotaBytes: 4096,
      storageUsedBytes: 1424,
    }),
  );
  expect(await screen.findByText(/lesson-4\.pdf/i)).toBeInTheDocument();
});

test("authenticated upload quota increment is ignored after switching users", async () => {
  const user = userEvent.setup();
  let resolveUpload: ((value: unknown) => void) | null = null;
  libraryClientMocks.uploadPdfDocumentToCloud.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveUpload = resolve;
      }),
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getAllByRole("button", { name: /未打开文档/i })[0]);
  const uploadInput = screen.getAllByLabelText(/upload pdf input/i)[0];
  await user.upload(
    uploadInput,
    new File([new Uint8Array(400)], "lesson-3.pdf", { type: "application/pdf" }),
  );

  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-2",
      email: "other@example.com",
      storageQuotaBytes: 4096,
      storageUsedBytes: 900,
    },
  });

  resolveUpload?.({
    documentId: "doc-1",
    storagePath: "users/user-123/pdf/doc-1.pdf",
    pdfDocument: {
      id: "doc-1",
      userId: "user-123",
      fileName: "lesson-3.pdf",
      fileSizeBytes: 400,
      storagePath: "users/user-123/pdf/doc-1.pdf",
      createdAt: "2026-03-25T10:00:00.000Z",
    },
    withinQuota: true,
  });

  await waitFor(() =>
    expect(libraryClientMocks.uploadPdfDocumentToCloud).toHaveBeenCalledTimes(
      1,
    ),
  );

  await waitFor(() =>
    expect(authStore.getState().session).toEqual({
      status: "authenticated",
      userId: "user-2",
      email: "other@example.com",
      storageQuotaBytes: 4096,
      storageUsedBytes: 900,
    }),
  );
});
