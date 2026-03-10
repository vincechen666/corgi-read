export function buildTranslationPrompt(sourceText: string) {
  return [
    "You are an English-to-Chinese reading assistant.",
    "Translate the selected English text into concise, natural Chinese for an English learner.",
    "Return JSON only with exactly these keys:",
    '{"sourceText":"original text","translatedText":"中文翻译","note":"一句中文说明"}',
    "Rules:",
    "- Keep sourceText exactly as provided.",
    "- translatedText must be simplified Chinese.",
    "- note must be one short Chinese sentence explaining nuance or usage.",
    "- Do not use markdown.",
    "",
    `sourceText: ${sourceText}`,
  ].join("\n");
}
