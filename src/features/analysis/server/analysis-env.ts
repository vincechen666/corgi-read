import type { AnalysisMode } from "@/features/analysis/analysis-schema";

type AnalysisEnv = {
  AI_MODE?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_BASE_URL?: string;
};

export function resolveAnalysisMode(env: AnalysisEnv): AnalysisMode {
  if (env.AI_MODE === "mock") {
    return "mock";
  }

  if (env.AI_MODE === "real") {
    return "real";
  }

  return env.OPENROUTER_API_KEY ? "real" : "mock";
}

export function getAnalysisConfig(env: AnalysisEnv) {
  const mode = resolveAnalysisMode(env);

  return {
    mode,
    apiKey: env.OPENROUTER_API_KEY,
    model: env.OPENROUTER_MODEL ?? "stepfun/step-3.5-flash",
    baseUrl: env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
  };
}
