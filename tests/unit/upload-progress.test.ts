import { expect, test } from "vitest";

import { toUploadProgressPercent } from "@/features/library/upload-progress";

test("converts uploaded bytes to a clamped percentage", () => {
  expect(toUploadProgressPercent(0, 100)).toBe(0);
  expect(toUploadProgressPercent(50, 100)).toBe(50);
  expect(toUploadProgressPercent(150, 100)).toBe(100);
});
