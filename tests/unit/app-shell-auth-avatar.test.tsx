import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { AppShell } from "@/components/reader/app-shell";
import { authStore } from "@/features/auth/auth-store";

const authMocks = vi.hoisted(() => {
  const state = {
    session: null as
      | {
          user: { id: string; email: string };
        }
      | null,
  };

  return {
    state,
    getSession: vi.fn(async () => ({
      data: { session: state.session },
    })),
    loadSidebarCloudState: vi.fn(async () => ({
      recordings: [],
      favorites: [],
      expressions: [],
    })),
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })),
    signOut: vi.fn(async () => ({ error: null })),
  };
});

vi.mock("@/features/analysis/analysis-client", () => ({
  analyzeTranscript: vi.fn(),
  transcribeAudio: vi.fn(),
}));

vi.mock("@/features/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
      signOut: authMocks.signOut,
    },
  })),
}));

vi.mock("@/features/sidebar/sidebar-cloud-client", () => ({
  loadSidebarCloudState: authMocks.loadSidebarCloudState,
  saveExpressionToCloud: vi.fn(),
  saveFavoriteToCloud: vi.fn(),
  saveRecordingToCloud: vi.fn(),
}));

afterEach(() => {
  cleanup();
  authMocks.getSession.mockClear();
  authMocks.loadSidebarCloudState.mockClear();
  authMocks.onAuthStateChange.mockClear();
  authMocks.signOut.mockClear();
  authMocks.state.session = null;
  authStore.setState({
    session: { status: "guest", userId: null, email: null },
  });
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.local");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
});

test("guest avatar opens the auth modal", async () => {
  const user = userEvent.setup();

  render(<AppShell />);

  await user.click(screen.getAllByTestId("topbar-avatar-button")[0]);

  expect(
    screen.getByRole("heading", { name: /email login/i }),
  ).toBeInTheDocument();
});

test("auth modal closes after the session becomes authenticated", async () => {
  const user = userEvent.setup();

  render(<AppShell />);

  await user.click(screen.getAllByTestId("topbar-avatar-button")[0]);
  expect(
    screen.getByRole("heading", { name: /email login/i }),
  ).toBeInTheDocument();

  act(() => {
    authStore.getState().setAuthenticated("user-1", "reader@example.com");
  });

  await waitFor(() => {
    expect(
      screen.queryByRole("heading", { name: /email login/i }),
    ).not.toBeInTheDocument();
  });
});

test("authenticated avatar opens user menu", async () => {
  const user = userEvent.setup();

  authMocks.state.session = {
    user: {
      id: "user-1",
      email: "reader@example.com",
    },
  };
  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-1",
      email: "reader@example.com",
    },
  });

  render(<AppShell />);

  await user.click(screen.getAllByTestId("topbar-avatar-button")[0]);

  expect(await screen.findByRole("menu")).toBeInTheDocument();
});

test("menu shows email and 退出登录", async () => {
  const user = userEvent.setup();

  authMocks.state.session = {
    user: {
      id: "user-1",
      email: "reader@example.com",
    },
  };
  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-1",
      email: "reader@example.com",
    },
  });

  render(<AppShell />);

  await user.click(screen.getAllByTestId("topbar-avatar-button")[0]);

  const menu = await screen.findByRole("menu");
  expect(menu).toHaveTextContent("reader@example.com");
  expect(
    within(menu).getByRole("menuitem", { name: /退出登录/i }),
  ).toBeInTheDocument();
});

test("logout returns the app to guest", async () => {
  const user = userEvent.setup();

  authMocks.state.session = {
    user: {
      id: "user-1",
      email: "reader@example.com",
    },
  };
  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-1",
      email: "reader@example.com",
    },
  });

  render(<AppShell />);

  await user.click(screen.getAllByTestId("topbar-avatar-button")[0]);
  const menu = await screen.findByRole("menu");
  await user.click(within(menu).getByRole("menuitem", { name: /退出登录/i }));

  await waitFor(() => expect(authMocks.signOut).toHaveBeenCalledTimes(1));
  expect(authStore.getState().session).toEqual({
    status: "guest",
    userId: null,
    email: null,
  });
});
