import { normalizeText } from "./normalization";

export type EvidenceValidation = {
  valid: boolean;
  normalizedEvidence: string;
  reason: string | null;
};

export function validateEvidenceQuote(input: {
  sourceText: string;
  evidenceText: string;
  pageStart: number;
  pageEnd: number;
}): EvidenceValidation {
  const normalizedEvidence = normalizeText(input.evidenceText);
  const normalizedSource = normalizeText(input.sourceText);

  if (!normalizedEvidence) {
    return {
      valid: false,
      normalizedEvidence,
      reason: "Evidence quote is empty",
    };
  }
  if (input.pageStart < 1 || input.pageEnd < input.pageStart) {
    return {
      valid: false,
      normalizedEvidence,
      reason: "Evidence page range is invalid",
    };
  }
  if (!normalizedSource.includes(normalizedEvidence)) {
    return {
      valid: false,
      normalizedEvidence,
      reason: "Evidence quote does not occur in the indexed source text",
    };
  }
  return { valid: true, normalizedEvidence, reason: null };
}
