import { describe, expect, test } from "vitest";

import { translationResultSchema } from "@/features/translation/translation-schema";

describe("translationResultSchema", () => {
  test("accepts source text, chinese translation, and note", () => {
    const result = translationResultSchema.parse({
      sourceText: "deliberate translation moment",
      translatedText: "按需触发的翻译提示",
      note: "在卡住时快速确认含义",
    });

    expect(result.translatedText).toBe("按需触发的翻译提示");
  });
});
