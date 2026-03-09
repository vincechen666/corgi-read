import {
  analysisRouteResponseSchema,
  transcriptionRouteResponseSchema,
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

  return response.json();
}

async function postFormData(url: string, body: FormData) {
  const response = await fetch(url, {
    method: "POST",
    body,
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

  return response.json();
}

export async function transcribeAudio(audioBlob: Blob | null) {
  const formData = new FormData();
  const audioFile = new File(
    [audioBlob ?? new Blob()],
    "retelling.webm",
    {
      type: audioBlob?.type || "audio/webm",
    },
  );
  formData.append("audio", audioFile);

  const json = await postFormData("/api/transcribe", formData);
  return transcriptionRouteResponseSchema.parse(json);
}

export async function analyzeTranscript(transcript: string) {
  const json = await postJson("/api/analysis", { transcript });
  return analysisRouteResponseSchema.parse(json);
}
