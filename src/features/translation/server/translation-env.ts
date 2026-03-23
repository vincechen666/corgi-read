export type TranslationMode = "mock" | "real";

type TranslationEnv = {
  TRANSLATION_MODE?: string;
  TRANSLATION_PROVIDER?: string;
  GOOGLE_CLOUD_PROJECT?: string;
  GOOGLE_TRANSLATE_LOCATION?: string;
  GOOGLE_TRANSLATE_ACCESS_TOKEN?: string;
  GOOGLE_APPLICATION_CREDENTIALS?: string;
} & Record<string, string | undefined>;

export function resolveTranslationMode(
  env: TranslationEnv,
): TranslationMode {
  if (env.TRANSLATION_MODE === "mock") {
    return "mock";
  }

  if (env.TRANSLATION_MODE === "real") {
    return "real";
  }

  return env.GOOGLE_TRANSLATE_ACCESS_TOKEN ||
    env.GOOGLE_APPLICATION_CREDENTIALS ||
    env.GOOGLE_CLOUD_PROJECT
    ? "real"
    : "mock";
}

export function getTranslationConfig(env: TranslationEnv) {
  return {
    mode: resolveTranslationMode(env),
    provider: "google" as const,
    projectId: env.GOOGLE_CLOUD_PROJECT,
    location: env.GOOGLE_TRANSLATE_LOCATION ?? "global",
    accessToken: env.GOOGLE_TRANSLATE_ACCESS_TOKEN,
    credentialsPath: env.GOOGLE_APPLICATION_CREDENTIALS,
  };
}
