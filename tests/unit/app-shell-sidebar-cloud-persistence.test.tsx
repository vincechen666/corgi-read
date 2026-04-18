import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import type { SidebarStorageShape } from "@/features/sidebar/sidebar-storage";

const analysisClientMocks = vi.hoisted(() => ({
  analyzeTranscript: vi.fn(),
  transcribeAudio: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({
    data: {
      subscription: {
        unsubscribe: vi.fn(),
      },
    },
  })),
}));

const libraryClientMocks = vi.hoisted(() => ({
  loadPdfLibraryDocuments: vi.fn(async () => []),
  uploadPdfDocumentToCloud: vi.fn(),
}));

const cloudState = vi.hoisted<SidebarStorageShape>(() => ({
  recordings: [],
  favorites: [],
  expressions: [],
}));

const sidebarCloudMocks = vi.hoisted(() => ({
  loadSidebarCloudState: vi.fn(async () => ({
    recordings: [...cloudState.recordings],
    favorites: [...cloudState.favorites],
    expressions: [...cloudState.expressions],
  })),
  saveExpressionToCloud: vi.fn(async ({ item }: { item: SidebarStorageShape["expressions"][number] }) => {
    cloudState.expressions = [item, ...cloudState.expressions];
    return item;
  }),
  saveFavoriteToCloud: vi.fn(async ({ item }: { item: SidebarStorageShape["favorites"][number] }) => {
    cloudState.favorites = [item, ...cloudState.favorites];
    return item;
  }),
  saveRecordingToCloud: vi.fn(async ({ item }: { item: SidebarStorageShape["recordings"][number] }) => {
    cloudState.recordings = [item, ...cloudState.recordings];
    return item;
  }),
}));

vi.mock("@/features/analysis/analysis-client", () => ({
  analyzeTranscript: analysisClientMocks.analyzeTranscript,
  transcribeAudio: analysisClientMocks.transcribeAudio,
}));

vi.mock("@/features/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn(),
    storage: { from: vi.fn() },
  })),
}));

vi.mock("@/features/library/library-client", () => ({
  loadPdfLibraryDocuments: libraryClientMocks.loadPdfLibraryDocuments,
  uploadPdfDocumentToCloud: libraryClientMocks.uploadPdfDocumentToCloud,
}));

vi.mock("@/features/sidebar/sidebar-cloud-client", () => ({
  loadSidebarCloudState: sidebarCloudMocks.loadSidebarCloudState,
  saveExpressionToCloud: sidebarCloudMocks.saveExpressionToCloud,
  saveFavoriteToCloud: sidebarCloudMocks.saveFavoriteToCloud,
  saveRecordingToCloud: sidebarCloudMocks.saveRecordingToCloud,
}));

vi.mock("@/components/reader/pdf-stage", () => ({
  PdfStage: ({
    onFavorite,
  }: {
    onFavorite?: (item: SidebarStorageShape["favorites"][number]) => void;
  }) => (
    <div data-testid="mock-pdf-stage">
      <button
        type="button"
        onClick={() =>
          onFavorite?.({
            id: "local-favorite-id",
            sourceText: "faithful attendants of Multivac",
            translatedText: "Multivac 的忠实看护者",
            type: "sentence",
            page: 12,
          })
        }
      >
        添加收藏
      </button>
    </div>
  ),
}));

vi.mock("@/components/reader/recording-button", () => ({
  RecordingButton: ({
    onStop,
  }: {
    onStop?: (audioBlob: Blob | null) => Promise<void> | void;
  }) => (
    <button
      type="button"
      onClick={() => {
        void onStop?.(new Blob(["audio"], { type: "audio/webm" }));
      }}
    >
      触发录音
    </button>
  ),
}));

import { AppShell } from "@/components/reader/app-shell";
import { authStore } from "@/features/auth/auth-store";
import { sidebarStore } from "@/features/sidebar/sidebar-store";

const authenticatedUserId = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  window.localStorage.clear();
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

  cloudState.recordings = [];
  cloudState.favorites = [];
  cloudState.expressions = [];

  authMocks.getSession.mockReset();
  authMocks.onAuthStateChange.mockClear();
  libraryClientMocks.loadPdfLibraryDocuments.mockReset();
  libraryClientMocks.uploadPdfDocumentToCloud.mockReset();
  sidebarCloudMocks.loadSidebarCloudState.mockClear();
  sidebarCloudMocks.saveExpressionToCloud.mockClear();
  sidebarCloudMocks.saveFavoriteToCloud.mockClear();
  sidebarCloudMocks.saveRecordingToCloud.mockClear();
  analysisClientMocks.transcribeAudio.mockReset();
  analysisClientMocks.analyzeTranscript.mockReset();

  authMocks.getSession.mockResolvedValue({
    data: {
      session: {
        user: {
          id: authenticatedUserId,
          email: "reader@example.com",
        },
      },
    },
  });

  libraryClientMocks.loadPdfLibraryDocuments.mockResolvedValue([]);
  libraryClientMocks.uploadPdfDocumentToCloud.mockResolvedValue(undefined);
  analysisClientMocks.transcribeAudio.mockResolvedValue({
    result: {
      transcript: "People felt close to Multivac, yet its mysteries stayed beyond them.",
    },
    meta: {
      mode: "mock",
      provider: "mock",
      model: "mock",
    },
  });
  analysisClientMocks.analyzeTranscript.mockResolvedValue({
    result: {
      transcript: "People felt close to Multivac, yet its mysteries stayed beyond them.",
      corrected: "People felt close to Multivac, yet its mysteries stayed beyond them.",
      grammar: "Use yet to sharpen the contrast.",
      nativeExpression: "its mysteries stayed beyond them",
      coachFeedback: "Nice contrast.",
    },
    meta: {
      mode: "mock",
      provider: "mock",
      model: "mock",
    },
  });

  authStore.setState({
    session: {
      status: "authenticated",
      userId: authenticatedUserId,
      email: "reader@example.com",
    },
  });
  sidebarStore.setState({
    activeTab: "录音",
    recordings: [],
    favorites: [],
    expressions: [],
    persistenceMode: "memory",
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("authenticated sidebar records reload from cloud after a page refresh", async () => {
  const user = userEvent.setup();
  const firstRender = render(<AppShell />);

  await waitFor(() => {
    expect(sidebarCloudMocks.loadSidebarCloudState).toHaveBeenCalled();
  });

  await user.click(screen.getByRole("button", { name: "添加收藏" }));
  await waitFor(() => {
    expect(sidebarCloudMocks.saveFavoriteToCloud).toHaveBeenCalledTimes(1);
  });

  await user.click(screen.getByRole("button", { name: "触发录音" }));
  await screen.findByRole("dialog", { name: /ai retelling feedback/i });
  await waitFor(() => {
    expect(sidebarCloudMocks.saveRecordingToCloud).toHaveBeenCalledTimes(1);
  });

  const recordingSaveCall = sidebarCloudMocks.saveRecordingToCloud.mock.calls[0]?.[0] as {
    item: SidebarStorageShape["recordings"][number];
  };

  await user.click(screen.getByRole("button", { name: /加入表达库/i }));
  await waitFor(() => {
    expect(sidebarCloudMocks.saveExpressionToCloud).toHaveBeenCalledTimes(1);
  });

  const expressionSaveCall = sidebarCloudMocks.saveExpressionToCloud.mock.calls[0]?.[0] as {
    item: SidebarStorageShape["expressions"][number];
  };

  expect(expressionSaveCall.item.sourceRecordingId).toBe(recordingSaveCall.item.id);

  firstRender.unmount();

  render(<AppShell />);

  await waitFor(() => {
    expect(sidebarCloudMocks.loadSidebarCloudState).toHaveBeenCalledTimes(2);
  });

  await user.click(screen.getByRole("button", { name: "录音" }));
  expect(
    await screen.findByText(
      "People felt close to Multivac, yet its mysteries stayed beyond them.",
    ),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "收藏" }));
  expect(
    await screen.findByText("faithful attendants of Multivac"),
  ).toBeInTheDocument();
  expect(await screen.findByText("Multivac 的忠实看护者")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "表达库" }));
  expect(
    await screen.findByText("its mysteries stayed beyond them"),
  ).toBeInTheDocument();
});
