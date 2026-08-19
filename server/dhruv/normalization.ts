export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeDocumentNumber(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const normalized = value
    .toUpperCase()
    .replace(/[‐‑–—]/g, "-")
    .replace(/[^A-Z0-9/().-]+/g, "")
    .trim();
  return normalized || null;
}

export function normalizeDateReference(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!match) return null;
  const [, day, month, rawYear] = match;
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
