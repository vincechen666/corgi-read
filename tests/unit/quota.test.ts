import { expect, test } from "vitest";

import { canUploadFileWithinQuota } from "@/features/library/quota";

test("rejects upload when file exceeds remaining quota", () => {
  expect(
    canUploadFileWithinQuota({
      storageQuotaBytes: 1024,
      storageUsedBytes: 900,
      incomingFileSizeBytes: 200,
    }),
  ).toBe(false);
});
