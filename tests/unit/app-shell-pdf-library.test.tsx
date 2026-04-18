import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const libraryClientMocks = vi.hoisted(() => ({
  loadPdfLibraryDocuments: vi.fn(async () => [
    {
      id: "cloud-doc-1",
      fileName: "lesson-1.pdf",
      fileSizeBytes: 2048,
      createdAt: "2026-03-25T10:00:00.000Z",
      previewSource: "/sample/the-last-question.pdf",
      storagePath: "users/user-1/pdf/cloud-doc-1.pdf",
      userId: "user-1",
    },
  ]),
  uploadPdfDocumentToCloud: vi.fn(),
}));

vi.mock("@/features/library/library-client", () => ({
  loadPdfLibraryDocuments: libraryClientMocks.loadPdfLibraryDocuments,
  uploadPdfDocumentToCloud: libraryClientMocks.uploadPdfDocumentToCloud,
}));

vi.mock("@/features/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    from: vi.fn(),
    storage: { from: vi.fn() },
  })),
}));

vi.mock("@/features/analysis/analysis-client", () => ({
  transcribeAudio: vi.fn(),
  analyzeTranscript: vi.fn(),
}));

vi.mock("@/features/sidebar/sidebar-cloud-client", () => ({
  loadSidebarCloudState: vi.fn(async () => ({
    recordings: [],
    favorites: [],
    expressions: [],
  })),
  saveExpressionToCloud: vi.fn(),
  saveFavoriteToCloud: vi.fn(),
  saveRecordingToCloud: vi.fn(),
}));

import { AppShell } from "@/components/reader/app-shell";
import { authStore } from "@/features/auth/auth-store";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  libraryClientMocks.loadPdfLibraryDocuments.mockClear();
  libraryClientMocks.loadPdfLibraryDocuments.mockResolvedValue([
    {
      id: "cloud-doc-1",
      fileName: "lesson-1.pdf",
      fileSizeBytes: 2048,
      createdAt: "2026-03-25T10:00:00.000Z",
      previewSource: "/sample/the-last-question.pdf",
      storagePath: "users/user-1/pdf/cloud-doc-1.pdf",
      userId: "user-1",
    },
  ]);
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  authStore.setState({
    session: { status: "guest", userId: null, email: null },
  });
});

test("authenticated users can open and close the pdf library panel", async () => {
  const user = userEvent.setup();
  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-1",
      email: "reader@example.com",
    },
  });

  render(<AppShell />);

  await user.click(screen.getByRole("button", { name: /pdf library/i }));

  expect(await screen.findByText("lesson-1.pdf")).toBeInTheDocument();

  await user.click(screen.getByTestId("pdf-library-backdrop"));

  expect(screen.queryByText("lesson-1.pdf")).not.toBeInTheDocument();
});

test("opening a library document updates the reading document label", async () => {
  const user = userEvent.setup();
  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-1",
      email: "reader@example.com",
    },
  });

  render(<AppShell />);

  await user.click(screen.getByTestId("pdf-library-trigger"));
  await user.click(await screen.findByRole("button", { name: /lesson-1\.pdf/i }));

  expect(screen.queryByTestId("pdf-library-backdrop")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /lesson-1\.pdf/i }),
  ).toBeInTheDocument();
});

test("authenticated users load cloud library documents after refresh", async () => {
  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-1",
      email: "reader@example.com",
    },
  });

  render(<AppShell />);

  await waitFor(() =>
    expect(libraryClientMocks.loadPdfLibraryDocuments).toHaveBeenCalledWith({
      client: expect.objectContaining({
        from: expect.any(Function),
        storage: expect.any(Object),
      }),
      userId: "user-1",
    }),
  );
});
