import { translationResultSchema } from "@/features/translation/translation-schema";
import { buildTranslationPrompt } from "@/features/translation/server/translation-prompt";

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

export async function requestOpenRouterTranslation(
  config: OpenRouterConfig,
  sourceText: string,
  fetchImpl: typeof fetch = fetch,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  let response: Response;

  try {
    response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
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
            content: buildTranslationPrompt(sourceText),
          },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OpenRouter translation request timed out");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error("OpenRouter translation request failed");
  }

  const json = (await response.json()) as OpenRouterResponse;
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter returned no translation content");
  }

  return translationResultSchema.parse(JSON.parse(content));
}
