import { beforeEach, describe, expect, test } from "vitest";

import {
  SIDEBAR_STORAGE_KEY,
  type SidebarStorageShape,
} from "@/features/sidebar/sidebar-storage";
import {
  createSidebarStore,
  hydrateSidebarStore,
} from "@/features/sidebar/sidebar-store";

describe("sidebar-store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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

  test("does not duplicate the same favorite when ids differ", () => {
    const store = createSidebarStore();

    store.getState().addFavorite({
      id: "fav-1",
      sourceText: "faithful attendants of Multivac",
      translatedText: "Multivac 的忠实看护者",
      type: "sentence",
      page: 12,
    });
    store.getState().addFavorite({
      id: "fav-2",
      sourceText: "faithful attendants of Multivac",
      translatedText: "Multivac 的忠实看护者",
      type: "sentence",
      page: 12,
    });

    expect(store.getState().favorites).toHaveLength(1);
  });

  test("does not duplicate the same expression when ids differ", () => {
    const store = createSidebarStore();

    store.getState().addExpression({
      id: "expression-1",
      phrase: "its mysteries still seemed beyond them",
      note: "native contrast",
      sourceRecordingId: "recording-1",
    });
    store.getState().addExpression({
      id: "expression-2",
      phrase: "its mysteries still seemed beyond them",
      note: "native contrast",
      sourceRecordingId: "recording-1",
    });

    expect(store.getState().expressions).toHaveLength(1);
  });

  test("does not read persisted recordings during initial client render", () => {
    const persisted: SidebarStorageShape = {
      favorites: [],
      recordings: [
        {
          id: "recording-persisted",
          createdAt: "12:13 AM",
          page: 9,
          summary: "Persisted summary",
          feedback: "Persisted feedback",
        },
      ],
      expressions: [],
    };
    window.localStorage.setItem(
      SIDEBAR_STORAGE_KEY,
      JSON.stringify(persisted),
    );

    const store = createSidebarStore(undefined, { seedDefaults: true });

    expect(store.getState().recordings[0]?.createdAt).toBe("08:42 PM");
  });

  test("hydrates persisted recordings only after explicit hydration", () => {
    const persisted: SidebarStorageShape = {
      favorites: [],
      recordings: [
        {
          id: "recording-persisted",
          createdAt: "12:13 AM",
          page: 9,
          summary: "Persisted summary",
          feedback: "Persisted feedback",
        },
      ],
      expressions: [],
    };
    window.localStorage.setItem(
      SIDEBAR_STORAGE_KEY,
      JSON.stringify(persisted),
    );

    const store = createSidebarStore(undefined, { seedDefaults: true });
    hydrateSidebarStore(store);

    expect(store.getState().recordings[0]?.createdAt).toBe("12:13 AM");
  });
});
