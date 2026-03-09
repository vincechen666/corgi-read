import { analysisRouteResponseSchema } from "@/features/analysis/analysis-schema";
import { getAnalysisConfig } from "@/features/analysis/server/analysis-env";
import { requestOpenRouterAnalysis } from "@/features/analysis/server/openrouter-client";

type AnalysisEnv = {
  AI_MODE?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_BASE_URL?: string;
};

function buildMockResult(transcript: string) {
  return {
    transcript,
    corrected:
      "People felt close to Multivac, yet its mysteries still seemed beyond them.",
    grammar:
      "这里建议用 felt close to 和 yet 来表达更自然的对比关系，不要直接用 knew well but。",
    nativeExpression: "its mysteries still seemed beyond them",
    coachFeedback: "整体复述方向是对的，但连接和对比表达还可以更像母语者。",
  };
}

export async function analyzeRetelling(
  transcript: string,
  env: AnalysisEnv = process.env,
) {
  const config = getAnalysisConfig(env);

  if (config.mode === "mock") {
    return analysisRouteResponseSchema.parse({
      result: buildMockResult(transcript),
      meta: {
        mode: "mock",
        provider: "mock",
        model: config.model,
      },
    });
  }

  if (!config.apiKey) {
    throw new Error("OPENROUTER_API_KEY is required in real mode");
  }

  const result = await requestOpenRouterAnalysis(
    {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    },
    transcript,
  );

  return analysisRouteResponseSchema.parse({
    result,
    meta: {
      mode: "real",
      provider: "openrouter",
      model: config.model,
    },
  });
}
