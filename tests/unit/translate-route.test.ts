import { beforeEach, describe, expect, test, vi } from "vitest";

const translationServiceMocks = vi.hoisted(() => ({
  translateText: vi.fn(),
}));

vi.mock("@/features/translation/server/translation-service", () => ({
  translateText: translationServiceMocks.translateText,
}));

import { POST } from "@/app/api/translate/route";

describe("POST /api/translate", () => {
  beforeEach(() => {
    translationServiceMocks.translateText.mockReset();
  });

  test("returns a translation result when translation succeeds", async () => {
    translationServiceMocks.translateText.mockResolvedValue({
      sourceText: "stellar cartography",
      translatedText: "恒星制图",
      note: "当前结果由 Google 翻译生成，可结合上下文继续判断术语和语气。",
    });

    const response = await POST(
      new Request("http://localhost/api/translate", {
        method: "POST",
        body: JSON.stringify({ sourceText: "stellar cartography" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.translatedText).toBe("恒星制图");
  });

  test("logs provider failures in production without returning detail to the client", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    translationServiceMocks.translateText.mockRejectedValue(
      new Error("Google translation request failed: 403"),
    );

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(
      new Request("http://localhost/api/translate", {
        method: "POST",
        body: JSON.stringify({ sourceText: "stellar cartography" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error).toBe("Translation failed, please retry.");
    expect(json.detail).toBeUndefined();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });
});
