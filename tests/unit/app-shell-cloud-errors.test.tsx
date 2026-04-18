import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const libraryClientMocks = vi.hoisted(() => ({
  uploadPdfDocumentToCloud: vi.fn(),
}));

const sidebarCloudMocks = vi.hoisted(() => ({
  loadSidebarCloudState: vi.fn(async () => ({
    recordings: [],
    favorites: [],
    expressions: [],
  })),
  saveFavoriteToCloud: vi.fn(),
  saveRecordingToCloud: vi.fn(),
  saveExpressionToCloud: vi.fn(),
}));

vi.mock("@/features/library/library-client", () => ({
  uploadPdfDocumentToCloud: libraryClientMocks.uploadPdfDocumentToCloud,
}));

vi.mock("@/features/sidebar/sidebar-cloud-client", () => ({
  loadSidebarCloudState: sidebarCloudMocks.loadSidebarCloudState,
  saveFavoriteToCloud: sidebarCloudMocks.saveFavoriteToCloud,
  saveRecordingToCloud: sidebarCloudMocks.saveRecordingToCloud,
  saveExpressionToCloud: sidebarCloudMocks.saveExpressionToCloud,
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

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.spyOn(console, "error").mockImplementation(() => {});
  libraryClientMocks.uploadPdfDocumentToCloud.mockReset();
  sidebarCloudMocks.loadSidebarCloudState.mockReset();
  sidebarCloudMocks.loadSidebarCloudState.mockResolvedValue({
    recordings: [],
    favorites: [],
    expressions: [],
  });
  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-123",
      email: "reader@example.com",
      storageQuotaBytes: 1024,
      storageUsedBytes: 900,
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("shows a quota error without blocking the local reader", async () => {
  const user = userEvent.setup();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getAllByRole("button", { name: /未打开文档/i })[0]);
  const uploadInput = screen.getAllByLabelText(/upload pdf input/i)[0];
  await user.upload(
    uploadInput,
    new File([new Uint8Array(200)], "lesson-3.pdf", { type: "application/pdf" }),
  );

  expect(await screen.findByText(/lesson-3\.pdf/i)).toBeInTheDocument();
  expect(await screen.findByTestId("cloud-error-banner")).toHaveTextContent(
    "已达到 1 GB 空间上限",
  );
  expect(screen.queryByTestId("pdf-upload-progress")).not.toBeInTheDocument();
  expect(libraryClientMocks.uploadPdfDocumentToCloud).not.toHaveBeenCalled();
});

test("metadata insert failure hides upload progress and keeps the cloud error banner", async () => {
  const user = userEvent.setup();
  let rejectUpload: ((reason?: unknown) => void) | null = null;
  libraryClientMocks.uploadPdfDocumentToCloud.mockImplementationOnce(
    ({ onProgress }: { onProgress?: (percent: number) => void }) =>
      new Promise((_, reject) => {
        onProgress?.(72);
        rejectUpload = reject;
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

  expect(await screen.findByTestId("pdf-upload-progress")).toHaveTextContent(
    "72%",
  );

  rejectUpload?.(new Error("Supabase metadata insert failed: metadata failed"));

  await waitFor(() => {
    expect(screen.queryByTestId("pdf-upload-progress")).not.toBeInTheDocument();
  });
  expect(await screen.findByTestId("cloud-error-banner")).toHaveTextContent(
    "云端保存失败",
  );
});

test("shows a cloud data load error when sidebar sync fails", async () => {
  sidebarCloudMocks.loadSidebarCloudState.mockRejectedValueOnce(
    new Error("boom"),
  );

  render(<AppShell />);

  await waitFor(() =>
    expect(screen.getByTestId("cloud-error-banner")).toHaveTextContent(
      "云端数据加载失败",
    ),
  );
});
