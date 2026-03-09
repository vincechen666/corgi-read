import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Page from "@/app/page";

test("renders the reader workspace, learning sidebar, and recording button", () => {
  render(<Page />);

  expect(screen.getByText(/read in english/i)).toBeInTheDocument();
  expect(screen.getByText(/你的学习沉淀/i)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /start retelling/i }),
  ).toBeInTheDocument();
});
