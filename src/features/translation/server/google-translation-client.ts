type GoogleTranslationConfig = {
  accessToken: string;
  projectId: string;
  location: string;
};

type GoogleTranslationResponse = {
  translations?: Array<{
    translatedText?: string;
  }>;
};

export async function requestGoogleTranslation(
  config: GoogleTranslationConfig,
  sourceText: string,
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl(
    `https://translation.googleapis.com/v3/projects/${config.projectId}/locations/${config.location}:translateText`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json; charset=utf-8",
        "x-goog-user-project": config.projectId,
      },
      body: JSON.stringify({
        sourceLanguageCode: "en",
        targetLanguageCode: "zh-CN",
        contents: [sourceText],
        mimeType: "text/plain",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Google translation request failed: ${response.status}`);
  }

  const json = (await response.json()) as GoogleTranslationResponse;
  const translatedText = json.translations?.[0]?.translatedText;

  if (!translatedText) {
    throw new Error("Google translation response was missing translatedText");
  }

  return translatedText;
}
