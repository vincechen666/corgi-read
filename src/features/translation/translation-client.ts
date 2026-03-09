import {
  type TranslationResult,
  translationResultSchema,
} from "@/features/translation/translation-schema";

const dictionary: Record<string, TranslationResult> = {
  "deliberate translation moment": {
    sourceText: "deliberate translation moment",
    translatedText: "按需触发的翻译提示",
    note: "用户卡住时再看中文，避免阅读区长期双语并列。",
  },
  "faithful attendants of Multivac": {
    sourceText: "faithful attendants of Multivac",
    translatedText: "Multivac 的忠实看护者",
    note: "更像是长期守在系统旁、熟悉机器脾气的值守者。",
  },
};

export async function translateSelection(
  sourceText: string,
): Promise<TranslationResult> {
  const normalized = sourceText.trim();
  const result = dictionary[normalized] ?? {
    sourceText: normalized,
    translatedText: "中文翻译待确认",
    note: "这是一个 mock 结果，后续会接入真实翻译服务。",
  };

  return translationResultSchema.parse(result);
}
