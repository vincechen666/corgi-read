import { isValidElement } from "react";
import { expect, test } from "vitest";

import RootLayout from "@/app/layout";

test("suppresses hydration warnings on the root html element", () => {
  const element = RootLayout({
    children: <div>content</div>,
  });

  expect(isValidElement(element)).toBe(true);
  expect(element.props.suppressHydrationWarning).toBe(true);
});
