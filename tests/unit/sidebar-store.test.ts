import { describe, expect, test } from "vitest";

import { createSidebarStore } from "@/features/sidebar/sidebar-store";

describe("sidebar-store", () => {
  test("adds a collected sentence into favorites", () => {
    const store = createSidebarStore();

    store.getState().addFavorite({
      id: "fav-1",
      sourceText: "faithful attendants of Multivac",
      translatedText: "Multivac 的忠实看护者",
      type: "sentence",
      page: 12,
    });

    expect(store.getState().favorites).toHaveLength(1);
  });
});
