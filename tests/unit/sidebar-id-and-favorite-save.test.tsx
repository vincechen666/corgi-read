import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

import { TranslationPopover } from "@/components/reader/translation-popover";
import { createSidebarItemId } from "@/features/sidebar/sidebar-id";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

beforeEach(() => {
  window.localStorage.clear();
});

test("creates UUID identifiers for cloud-backed sidebar entries", () => {
  expect(createSidebarItemId()).toMatch(uuidPattern);
});

test("translation favorites create UUID identifiers before cloud save", async () => {
  const onFavorite = vi.fn();
  const user = userEvent.setup();

  render(
    <TranslationPopover
      onFavorite={onFavorite}
      result={{
        sourceText: "faithful attendants of Multivac",
        translatedText: "Multivac 的忠实看护者",
        note: "短语释义",
      }}
      x={0}
      y={0}
    />,
  );

  await user.click(screen.getByRole("button", { name: /收藏词句/i }));

  expect(onFavorite).toHaveBeenCalledTimes(1);
  expect(onFavorite.mock.calls[0]?.[0]).toEqual(
    expect.objectContaining({
      id: expect.stringMatching(uuidPattern),
      page: 12,
      sourceText: "faithful attendants of Multivac",
      translatedText: "Multivac 的忠实看护者",
      type: "sentence",
    }),
  );
});
