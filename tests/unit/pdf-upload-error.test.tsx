import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import { AppShell } from "@/components/reader/app-shell";

test("shows inline error when a non-pdf file is selected", async () => {
  const user = userEvent.setup({ applyAccept: false });

  render(<AppShell />);

  await user.click(screen.getByRole("button", { name: /未打开文档/i }));
  await user.upload(
    screen.getByLabelText(/upload pdf input/i),
    new File(["bad"], "notes.txt", { type: "text/plain" }),
  );

  expect(await screen.findByText(/please choose a pdf/i)).toBeInTheDocument();
});
