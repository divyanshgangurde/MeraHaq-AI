import type { CitationCandidate } from "./domain";
import { validateEvidenceQuote } from "./evidenceValidation";

export function validateCitation(candidate: CitationCandidate): {
  valid: boolean;
  reason: string | null;
} {
  try {
    const url = new URL(candidate.sourceUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return {
        valid: false,
        reason: "Citation source URL must use HTTP or HTTPS",
      };
    }
  } catch {
    return { valid: false, reason: "Citation source URL is invalid" };
  }

  const evidence = validateEvidenceQuote({
    sourceText: candidate.sourceText,
    evidenceText: candidate.quote,
    pageStart: candidate.pageStart,
    pageEnd: candidate.pageEnd,
  });
  return { valid: evidence.valid, reason: evidence.reason };
}
