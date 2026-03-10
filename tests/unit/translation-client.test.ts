import { afterEach, expect, test, vi } from "vitest";

import { translateSelection } from "@/features/translation/translation-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("requests translations from the server translation route", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      sourceText: "faithful attendants of Multivac",
      translatedText: "Multivac 的忠实看护者",
      note: "更像是长期守在系统旁的值守者。",
    }),
  });
  vi.stubGlobal("fetch", fetchMock);

  const result = await translateSelection("faithful attendants of Multivac");

  expect(fetchMock).toHaveBeenCalledWith(
    "/api/translate",
    expect.objectContaining({
      method: "POST",
    }),
  );
  expect(result.translatedText).toBe("Multivac 的忠实看护者");
});
