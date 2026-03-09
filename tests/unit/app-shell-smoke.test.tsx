import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";

import Page from "@/app/page";

test("renders the reader app shell heading", () => {
  render(<Page />);

  expect(
    screen.getByRole("heading", { level: 1, name: /english pdf reader/i }),
  ).toBeInTheDocument();
});
