export function buildAnalysisPrompt(transcript: string) {
  return [
    "You are an English retelling coach.",
    "Analyze only the transcript provided by the user.",
    "Return strict JSON with keys transcript, corrected, grammar, nativeExpression, coachFeedback.",
    "Use English for corrected and nativeExpression.",
    "Use Chinese for grammar and coachFeedback.",
    "Do not include markdown or code fences.",
    `Transcript: ${transcript}`,
  ].join("\n");
}
