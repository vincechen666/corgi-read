import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";

import { LearningSidebar } from "@/components/reader/learning-sidebar";
import { sidebarStore } from "@/features/sidebar/sidebar-store";

beforeEach(() => {
  sidebarStore.setState({
    activeTab: "录音",
    recordings: [],
    favorites: [],
    expressions: [],
  });
});

afterEach(() => {
  cleanup();
});

test("shows an authenticated empty state when cloud sidebar data has not loaded yet", () => {
  render(<LearningSidebar isAuthenticated />);

  expect(screen.getByText("云端录音记录会显示在这里。")).toBeInTheDocument();
});
