export function normalizeSelectionText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
