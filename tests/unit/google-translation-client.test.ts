import { expect, test, vi } from "vitest";

import { requestGoogleTranslation } from "@/features/translation/server/google-translation-client";

test("requests Google Cloud translateText and parses translated text", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      translations: [{ translatedText: "恒星制图" }],
    }),
  });

  const translatedText = await requestGoogleTranslation(
    {
      accessToken: "token",
      projectId: "demo-project",
      location: "global",
    },
    "stellar cartography",
    fetchMock,
  );

  expect(fetchMock).toHaveBeenCalledWith(
    "https://translation.googleapis.com/v3/projects/demo-project/locations/global:translateText",
    expect.objectContaining({
      method: "POST",
    }),
  );
  expect(translatedText).toBe("恒星制图");
});

test("throws a clear error when Google returns a non-ok response", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status: 403,
    json: async () => ({}),
  });

  await expect(
    requestGoogleTranslation(
      {
        accessToken: "token",
        projectId: "demo-project",
        location: "global",
      },
      "stellar cartography",
      fetchMock,
    ),
  ).rejects.toThrow("Google translation request failed: 403");
});

test("throws a clear error when translated text is missing", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      translations: [{}],
    }),
  });

  await expect(
    requestGoogleTranslation(
      {
        accessToken: "token",
        projectId: "demo-project",
        location: "global",
      },
      "stellar cartography",
      fetchMock,
    ),
  ).rejects.toThrow("Google translation response was missing translatedText");
});
