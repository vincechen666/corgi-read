import { analysisResultSchema } from "@/features/analysis/analysis-schema";
import { buildAnalysisPrompt } from "@/features/analysis/server/analysis-prompt";

type OpenRouterConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function requestOpenRouterAnalysis(
  config: OpenRouterConfig,
  transcript: string,
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "user",
          content: buildAnalysisPrompt(transcript),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("OpenRouter request failed");
  }

  const json = (await response.json()) as OpenRouterResponse;
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter returned no content");
  }

  return analysisResultSchema.parse(JSON.parse(content));
}
