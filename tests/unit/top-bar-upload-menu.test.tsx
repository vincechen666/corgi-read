import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { TopBar } from "@/components/reader/top-bar";

afterEach(() => {
  cleanup();
});

test("renders the updated CorgiRead brand title", () => {
  render(
    <TopBar
      documentLabel="未打开文档"
      menuOpen={false}
      onToggleMenu={vi.fn()}
      onUploadClick={vi.fn()}
    />,
  );

  expect(screen.getByText("CorgiRead")).toBeInTheDocument();
});

test("replaces the progress status chip with a circular avatar placeholder", () => {
  render(
    <TopBar
      documentLabel="未打开文档"
      menuOpen={false}
      onToggleMenu={vi.fn()}
      onUploadClick={vi.fn()}
    />,
  );

  expect(
    screen.queryByText(/Page 12 \/ Section 3 \/ 18 min/i),
  ).not.toBeInTheDocument();
  expect(screen.getByTestId("topbar-avatar-button")).toBeInTheDocument();
  expect(screen.getByAltText("CorgiRead avatar placeholder")).toBeInTheDocument();
});

test("opens the document menu and shows upload action", async () => {
  const user = userEvent.setup();
  const onToggleMenu = vi.fn();

  render(
    <TopBar
      documentLabel="未打开文档"
      menuOpen
      onToggleMenu={onToggleMenu}
      onUploadClick={vi.fn()}
    />,
  );

  await user.click(screen.getAllByRole("button", { name: /未打开文档/i })[0]);

  expect(onToggleMenu).toHaveBeenCalled();
  expect(
    screen.getByRole("menuitem", { name: /上传 pdf/i }),
  ).toBeInTheDocument();
});

test("anchors the upload menu to the document trigger instead of using a fixed offset", () => {
  render(
    <TopBar
      documentLabel="未打开文档"
      menuOpen
      onToggleMenu={vi.fn()}
      onUploadClick={vi.fn()}
    />,
  );

  expect(screen.getByTestId("topbar-file-trigger-wrap")).toHaveClass("relative");
  expect(screen.getByRole("menu")).toHaveClass("left-0");
  expect(screen.getByRole("menu")).toHaveClass("top-full");
});
