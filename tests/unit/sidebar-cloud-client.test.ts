import { expect, test } from "vitest";

import { mapFavoriteToCloudRow } from "@/features/sidebar/sidebar-cloud-client";

test("maps sidebar favorites into cloud row shape", () => {
  expect(
    mapFavoriteToCloudRow(
      {
        id: "12-hello",
        sourceText: "hello",
        translatedText: "你好",
        type: "sentence",
        page: 12,
      },
      {
        userId: "user-1",
      },
    ).source_text,
  ).toBe("hello");
});
