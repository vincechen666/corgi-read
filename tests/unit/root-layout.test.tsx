import { isValidElement } from "react";
import { expect, test } from "vitest";

import RootLayout, { metadata } from "@/app/layout";

test("suppresses hydration warnings on the root html element", () => {
  const element = RootLayout({
    children: <div>content</div>,
  });

  expect(isValidElement(element)).toBe(true);
  expect(element.props.suppressHydrationWarning).toBe(true);
});

test("uses logo.webp as the site icon", () => {
  expect(metadata.icons).toMatchObject({
    icon: "/logo.webp",
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  });
});
