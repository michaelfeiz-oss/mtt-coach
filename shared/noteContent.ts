const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  "#39": "'",
  nbsp: " ",
};

function decodeHtmlEntities(value: string) {
  return value.replace(/&([a-zA-Z0-9#]+);/g, (match, entity) => {
    return ENTITY_MAP[entity] ?? match;
  });
}

export function stripNoteHtmlToText(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "- ")
      .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]*>/g, "")
  )
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hasVisibleNoteContent(value: string) {
  return stripNoteHtmlToText(value).length > 0;
}

export function deriveNoteTitle(
  content: string,
  fallback = "Live note",
  maxLength = 120
) {
  const firstLine =
    stripNoteHtmlToText(content)
      .split("\n")
      .map(line => line.replace(/^[-*]\s+/, "").trim())
      .find(Boolean) ?? fallback;
  const normalized = firstLine.replace(/\s+/g, " ").trim() || fallback;

  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
