import { getAnalysisConfig } from "@/features/analysis/server/analysis-env";
import { translationResultSchema } from "@/features/translation/translation-schema";
import { requestOpenRouterTranslation } from "@/features/translation/server/openrouter-translation-client";

type TranslationEnv = {
  AI_MODE?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_BASE_URL?: string;
} & Record<string, string | undefined>;

const dictionary = new Map([
  [
    "deliberate translation moment",
    {
      sourceText: "deliberate translation moment",
      translatedText: "按需触发的翻译提示",
      note: "强调只有在卡住时才调出中文辅助。",
    },
  ],
  [
    "faithful attendants of Multivac",
    {
      sourceText: "faithful attendants of Multivac",
      translatedText: "Multivac 的忠实看护者",
      note: "更像长期守在系统旁、熟悉机器脾气的值守者。",
    },
  ],
]);

function buildFallbackTranslation(sourceText: string) {
  const normalized = sourceText.trim();

  return (
    dictionary.get(normalized) ?? {
      sourceText: normalized,
      translatedText: `中文翻译：${normalized}`,
      note: "当前为 mock 翻译结果，后续可继续优化语义细节。",
    }
  );
}

export async function translateText(
  sourceText: string,
  env: TranslationEnv = process.env,
) {
  const normalized = sourceText.trim();
  const config = getAnalysisConfig(env);
  const dictionaryMatch = dictionary.get(normalized);

  if (dictionaryMatch) {
    return translationResultSchema.parse(dictionaryMatch);
  }

  if (config.mode === "mock") {
    return translationResultSchema.parse(buildFallbackTranslation(normalized));
  }

  if (!config.apiKey) {
    throw new Error("OPENROUTER_API_KEY is required in real mode");
  }

  const fallbackResult = buildFallbackTranslation(normalized);
  const realTranslation = requestOpenRouterTranslation(
    {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    },
    normalized,
  ).catch(() => fallbackResult);

  const fallbackTimeout = new Promise<typeof fallbackResult>((resolve) => {
    setTimeout(() => resolve(fallbackResult), 1500);
  });

  return translationResultSchema.parse(
    await Promise.race([realTranslation, fallbackTimeout]),
  );
}
