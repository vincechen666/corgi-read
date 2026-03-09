import {
  analysisRouteResponseSchema,
  transcriptionResultSchema,
} from "@/features/analysis/analysis-schema";

async function postJson<TBody>(
  url: string,
  body: TBody,
  init?: RequestInit,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export async function transcribeAudio(audioBlob: Blob | null) {
  const payload = {
    hasAudio: Boolean(audioBlob),
  };

  const json = await postJson("/api/transcribe", payload);
  return transcriptionResultSchema.parse(json);
}

export async function analyzeTranscript(transcript: string) {
  const json = await postJson("/api/analysis", { transcript });
  return analysisRouteResponseSchema.parse(json);
}
