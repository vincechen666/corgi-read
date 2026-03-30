import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { AppShell } from "@/components/reader/app-shell";
import { authStore } from "@/features/auth/auth-store";

const authMocks = vi.hoisted(() => ({
  signOut: vi.fn(async () => ({ error: null })),
  loadSidebarCloudState: vi.fn(async () => ({
    recordings: [],
    favorites: [],
    expressions: [],
  })),
}));

vi.mock("@/features/analysis/analysis-client", () => ({
  analyzeTranscript: vi.fn(),
  transcribeAudio: vi.fn(),
}));

vi.mock("@/features/auth/supabase-browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: {
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
  authMocks.signOut.mockClear();
  authMocks.loadSidebarCloudState.mockClear();
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

  expect(
    screen.queryByRole("heading", { name: /email verification/i }),
  ).not.toBeInTheDocument();

  await user.click(screen.getAllByTestId("topbar-avatar-button")[0]);

  expect(
    screen.getByRole("heading", { name: /email verification/i }),
  ).toBeInTheDocument();
});

test("authenticated avatar opens a small user menu", async () => {
  const user = userEvent.setup();

  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-1",
      email: "reader@example.com",
    },
  });

  render(<AppShell />);

  await user.click(screen.getAllByTestId("topbar-avatar-button")[0]);

  const menu = screen.getByRole("menu");
  expect(menu).toHaveTextContent("reader@example.com");
  expect(within(menu).getByRole("menuitem", { name: /退出登录/i })).toBeInTheDocument();
});

test("logout returns the app to guest mode", async () => {
  const user = userEvent.setup();

  authStore.setState({
    session: {
      status: "authenticated",
      userId: "user-1",
      email: "reader@example.com",
    },
  });

  render(<AppShell />);

  for (const avatarButton of screen.getAllByTestId("topbar-avatar-button")) {
    await user.click(avatarButton);
    if (screen.queryByRole("menu")) {
      break;
    }
  }

  const menu = await screen.findByRole("menu");
  await user.click(within(menu).getByRole("menuitem", { name: /退出登录/i }));

  await waitFor(() => expect(authMocks.signOut).toHaveBeenCalledTimes(1));
  expect(authStore.getState().session).toEqual({
    status: "guest",
    userId: null,
    email: null,
  });
});
