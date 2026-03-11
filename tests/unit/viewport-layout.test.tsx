import { cleanup, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { expect, test } from "vitest";

import Page from "@/app/page";

afterEach(() => {
  cleanup();
});

test("locks the app shell to the viewport and uses internal scrolling panes", () => {
  render(<Page />);

  expect(screen.getByTestId("app-shell")).toHaveClass("h-screen");
  expect(screen.getByTestId("app-shell")).toHaveClass("overflow-hidden");
  expect(screen.getByTestId("workspace-shell")).toHaveClass("min-h-0");
  expect(screen.getByTestId("pdf-stage-card")).toHaveClass("h-full");
  expect(screen.getByTestId("pdf-stage-viewer")).toHaveClass("overflow-auto");
  expect(screen.getByTestId("learning-sidebar")).toHaveClass("h-full");
  expect(screen.getByTestId("learning-sidebar-scroll")).toHaveClass("overflow-y-auto");
});

test("uses the compact straight-edge layout from the latest prototype", () => {
  render(<Page />);

  const appShell = screen.getAllByTestId("app-shell")[0];
  const workspaceShell = screen.getAllByTestId("workspace-shell")[0];
  const learningSidebar = screen.getAllByTestId("learning-sidebar")[0];
  const pdfStageCard = screen.getAllByTestId("pdf-stage-card")[0];

  expect(appShell).toHaveClass("px-3");
  expect(appShell).toHaveClass("py-3");
  expect(workspaceShell).toHaveClass("gap-3");
  expect(learningSidebar).toHaveClass("w-[356px]");
  expect(pdfStageCard).toHaveClass("rounded-none");
});
