import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { TopBar } from "@/components/reader/top-bar";

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

  await user.click(screen.getByRole("button", { name: /未打开文档/i }));

  expect(onToggleMenu).toHaveBeenCalled();
  expect(
    screen.getByRole("menuitem", { name: /上传 pdf/i }),
  ).toBeInTheDocument();
});
