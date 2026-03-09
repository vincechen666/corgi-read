import type { TranscriptionMode } from "@/features/analysis/analysis-schema";

type TranscriptionEnv = {
  TRANSCRIPTION_MODE?: string;
  TRANSCRIPTION_PROVIDER?: string;
  BAIDU_SPEECH_API_KEY?: string;
  BAIDU_SPEECH_SECRET_KEY?: string;
  BAIDU_SPEECH_MODEL?: string;
} & Record<string, string | undefined>;

export function resolveTranscriptionMode(
  env: TranscriptionEnv,
): TranscriptionMode {
  if (env.TRANSCRIPTION_MODE === "mock") {
    return "mock";
  }

  if (env.TRANSCRIPTION_MODE === "real") {
    return "real";
  }

  return env.BAIDU_SPEECH_API_KEY && env.BAIDU_SPEECH_SECRET_KEY
    ? "real"
    : "mock";
}

export function getTranscriptionConfig(env: TranscriptionEnv) {
  return {
    mode: resolveTranscriptionMode(env),
    provider: env.TRANSCRIPTION_PROVIDER ?? "baidu",
    model: env.BAIDU_SPEECH_MODEL ?? "1737",
    apiKey: env.BAIDU_SPEECH_API_KEY,
    secretKey: env.BAIDU_SPEECH_SECRET_KEY,
  };
}
