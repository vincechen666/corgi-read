import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { AppShell } from "@/components/reader/app-shell";
import { authStore } from "@/features/auth/auth-store";

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

const authMocks = vi.hoisted(() => {
  const unsubscribe = vi.fn();
  const onAuthStateChange = vi.fn(
    (callback: (event: string, session: unknown) => void) => {
      authMocks.listeners.push(callback);

      return {
        data: {
          subscription: {
            unsubscribe,
          },
        },
      };
    },
  );

  return {
    getSession: vi.fn(),
    listeners: [] as Array<(event: string, session: unknown) => void>,
    onAuthStateChange,
    unsubscribe,
  };
});

vi.mock("@/features/sidebar/sidebar-cloud-client", () => ({
  loadSidebarCloudState: sidebarCloudMocks.loadSidebarCloudState,
  saveFavoriteToCloud: sidebarCloudMocks.saveFavoriteToCloud,
  saveRecordingToCloud: sidebarCloudMocks.saveRecordingToCloud,
  saveExpressionToCloud: sidebarCloudMocks.saveExpressionToCloud,
}));

vi.mock("@/features/library/library-client", () => ({
  uploadPdfDocumentToCloud: vi.fn(),
}));

vi.mock("@/features/analysis/analysis-client", () => ({
  analyzeTranscript: vi.fn(),
  transcribeAudio: vi.fn(),
}));

vi.mock("@/features/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
    },
  })),
}));

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  authStore.setState({
    session: { status: "guest", userId: null, email: null },
  });
  sidebarCloudMocks.loadSidebarCloudState.mockClear();
  sidebarCloudMocks.loadSidebarCloudState.mockResolvedValue({
    recordings: [],
    favorites: [],
    expressions: [],
  });
  authMocks.getSession.mockReset();
  authMocks.onAuthStateChange.mockClear();
  authMocks.listeners.length = 0;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("hydrates the auth store from the Supabase session on mount", async () => {
  const authenticatedSession = {
    access_token: "access-token",
    expires_in: 3600,
    expires_at: 1711795200,
    refresh_token: "refresh-token",
    token_type: "bearer",
    user: {
      id: "user-123",
      email: "reader@example.com",
    },
  };

  authMocks.getSession.mockResolvedValueOnce({
    data: { session: authenticatedSession },
    error: null,
  });

  render(<AppShell />);

  await waitFor(() =>
    expect(authStore.getState().session).toEqual({
      status: "authenticated",
      userId: "user-123",
      email: "reader@example.com",
    }),
  );

  expect(authMocks.onAuthStateChange).toHaveBeenCalledTimes(1);
});

test("auth state changes switch the auth store between authenticated and guest", async () => {
  const authenticatedSession = {
    access_token: "access-token",
    expires_in: 3600,
    expires_at: 1711795200,
    refresh_token: "refresh-token",
    token_type: "bearer",
    user: {
      id: "user-123",
      email: "reader@example.com",
    },
  };

  authMocks.getSession.mockResolvedValueOnce({
    data: { session: null },
    error: null,
  });

  render(<AppShell />);

  await waitFor(() =>
    expect(authStore.getState().session).toEqual({
      status: "guest",
      userId: null,
      email: null,
    }),
  );

  authMocks.listeners[0]?.("SIGNED_IN", authenticatedSession);

  await waitFor(() =>
    expect(authStore.getState().session).toEqual({
      status: "authenticated",
      userId: "user-123",
      email: "reader@example.com",
    }),
  );

  authMocks.listeners[0]?.("SIGNED_OUT", null);

  await waitFor(() =>
    expect(authStore.getState().session).toEqual({
      status: "guest",
      userId: null,
      email: null,
    }),
  );
});

test("logout returns app state to guest", async () => {
  const authenticatedSession = {
    access_token: "access-token",
    expires_in: 3600,
    expires_at: 1711795200,
    refresh_token: "refresh-token",
    token_type: "bearer",
    user: {
      id: "user-123",
      email: "reader@example.com",
    },
  };

  authMocks.getSession.mockResolvedValueOnce({
    data: { session: authenticatedSession },
    error: null,
  });

  render(<AppShell />);

  await waitFor(() =>
    expect(authStore.getState().session).toEqual({
      status: "authenticated",
      userId: "user-123",
      email: "reader@example.com",
    }),
  );

  authMocks.listeners[0]?.("SIGNED_OUT", null);

  await waitFor(() =>
    expect(authStore.getState().session).toEqual({
      status: "guest",
      userId: null,
      email: null,
    }),
  );
});
