import { translationResultSchema } from "@/features/translation/translation-schema";
import { resolveGoogleAccessToken } from "@/features/translation/server/google-auth";
import { requestGoogleTranslation } from "@/features/translation/server/google-translation-client";
import { getTranslationConfig } from "@/features/translation/server/translation-env";

type TranslationEnv = {
  TRANSLATION_MODE?: string;
  TRANSLATION_PROVIDER?: string;
  GOOGLE_CLOUD_PROJECT?: string;
  GOOGLE_TRANSLATE_LOCATION?: string;
  GOOGLE_TRANSLATE_ACCESS_TOKEN?: string;
  GOOGLE_APPLICATION_CREDENTIALS?: string;
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

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.cause instanceof Error
        ? {
            cause: {
              name: error.cause.name,
              message: error.cause.message,
            },
          }
        : {}),
    };
  }

  return {
    message: String(error),
  };
}

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
  const config = getTranslationConfig(env);
  const dictionaryMatch = dictionary.get(normalized);

  if (dictionaryMatch) {
    return translationResultSchema.parse(dictionaryMatch);
  }

  if (config.mode === "mock") {
    return translationResultSchema.parse(buildFallbackTranslation(normalized));
  }

  if (!config.projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT is required in real mode");
  }

  const projectId = config.projectId;
  const fallbackResult = buildFallbackTranslation(normalized);
  const realTranslation = resolveGoogleAccessToken(env)
    .then((accessToken) =>
      requestGoogleTranslation(
        {
          accessToken,
          projectId,
          location: config.location,
        },
        normalized,
      ),
    )
    .then((translatedText) => ({
      sourceText: normalized,
      translatedText,
      note: "当前结果由 Google 翻译生成，可结合上下文继续判断术语和语气。",
    }))
    .catch((error) => {
      console.error("[translate] provider fallback", serializeError(error));
      return fallbackResult;
    });

  const fallbackTimeout = new Promise<typeof fallbackResult>((resolve) => {
    setTimeout(() => resolve(fallbackResult), 1500);
  });

  return translationResultSchema.parse(
    await Promise.race([realTranslation, fallbackTimeout]),
  );
}
