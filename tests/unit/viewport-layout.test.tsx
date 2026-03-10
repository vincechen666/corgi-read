import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Page from "@/app/page";

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
