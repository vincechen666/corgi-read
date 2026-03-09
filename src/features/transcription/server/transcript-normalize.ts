export function normalizeTranscript(transcript: string) {
  const compact = transcript.trim().replace(/\s+/g, " ");

  if (!compact) {
    return compact;
  }

  const firstLetterIndex = compact.search(/[A-Za-z]/);
  const normalizedCasing =
    firstLetterIndex >= 0
      ? `${compact.slice(0, firstLetterIndex)}${compact
          .charAt(firstLetterIndex)
          .toUpperCase()}${compact.slice(firstLetterIndex + 1)}`
      : compact;

  if (/[.!?]$/.test(normalizedCasing)) {
    return normalizedCasing;
  }

  return `${normalizedCasing}.`;
}
