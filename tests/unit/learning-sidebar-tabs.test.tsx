import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { LearningSidebar } from "@/components/reader/learning-sidebar";

test("renders the sidebar tabs as equal-width segments", () => {
  render(<LearningSidebar />);

  expect(screen.getByRole("button", { name: "录音" })).toHaveClass("flex-1");
  expect(screen.getByRole("button", { name: "收藏" })).toHaveClass("flex-1");
  expect(screen.getByRole("button", { name: "表达库" })).toHaveClass("flex-1");
});
