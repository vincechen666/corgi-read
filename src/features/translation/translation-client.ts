import {
  type TranslationResult,
  translationResultSchema,
} from "@/features/translation/translation-schema";

export async function translateSelection(
  sourceText: string,
): Promise<TranslationResult> {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sourceText: sourceText.trim(),
    }),
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ error: `Request failed: ${response.status}` }));
    const message =
      typeof errorBody.detail === "string"
        ? errorBody.detail
        : typeof errorBody.error === "string"
          ? errorBody.error
          : `Request failed: ${response.status}`;

    throw new Error(message);
  }

  const json = await response.json();
  return translationResultSchema.parse(json);
}
