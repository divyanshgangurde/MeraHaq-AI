import type { RelationshipType } from "./domain";
import { normalizeText } from "./normalization";

export type RelationshipDetection =
  | {
      state: "MATCHED";
      relationshipType: RelationshipType;
      confidence: number;
      scope: string | null;
      evidenceText: string;
      reason: string;
    }
  | {
      state: "UNKNOWN" | "REQUIRES_HUMAN_REVIEW";
      evidenceText: string;
      reason: string;
    };

type Rule = {
  relationshipType: RelationshipType;
  pattern: RegExp;
  confidence: number;
  scope?: string;
  reason: string;
};

const deterministicRules: Rule[] = [
  {
    relationshipType: "SUPERSEDES",
    pattern: /\b(?:supersedes|in supersession of)\b/i,
    confidence: 0.99,
    reason: "Explicit supersession language",
  },
  {
    relationshipType: "REVOKES",
    pattern: /\b(?:revokes|revoked|is hereby revoked)\b/i,
    confidence: 0.99,
    reason: "Explicit revocation language",
  },
  {
    relationshipType: "REPLACES",
    pattern: /\b(?:replaces|in substitution of)\b/i,
    confidence: 0.98,
    reason: "Explicit replacement language",
  },
  {
    relationshipType: "CORRIGES",
    pattern: /\b(?:corrigendum|corrigenda|corrects|correction to)\b/i,
    confidence: 0.98,
    reason: "Explicit correction language",
  },
  {
    relationshipType: "AMENDS",
    pattern: /\b(?:in partial modification of|partial modification of)\b/i,
    confidence: 0.97,
    scope: "partial modification",
    reason: "Explicit partial-modification language",
  },
  {
    relationshipType: "AMENDS",
    pattern:
      /\b(?:amendment\s+(?:in|to)\s+(?:the\s+)?(?:operational\s+)?guidelines|been amended|amended\s+(?:in|on|as of)|is amended|amends)\b/i,
    confidence: 0.97,
    reason: "Explicit amendment language",
  },
  {
    relationshipType: "EXTENDS",
    pattern: /\b(?:extends|extended until|extension of)\b/i,
    confidence: 0.96,
    reason: "Explicit extension language",
  },
  {
    relationshipType: "CONTINUES",
    pattern: /\b(?:shall continue|continues to remain in force|continued)\b/i,
    confidence: 0.94,
    reason: "Explicit continuation language",
  },
];

export function detectDeterministicRelationship(
  evidenceText: string
): RelationshipDetection {
  const normalized = normalizeText(evidenceText);
  if (!normalized) {
    return {
      state: "UNKNOWN",
      evidenceText,
      reason: "No evidence text was supplied",
    };
  }

  const rule = deterministicRules.find(candidate =>
    candidate.pattern.test(evidenceText)
  );
  if (rule) {
    return {
      state: "MATCHED",
      relationshipType: rule.relationshipType,
      confidence: rule.confidence,
      scope: rule.scope ?? null,
      evidenceText,
      reason: rule.reason,
    };
  }

  if (
    /\b(?:clarification|clarifies|interpretation of|with reference to)\b/i.test(
      evidenceText
    )
  ) {
    return {
      state: "MATCHED",
      relationshipType: "REFERENCES",
      confidence: 0.9,
      scope: null,
      evidenceText,
      reason: "Explicit clarification or reference language",
    };
  }

  if (/\b(?:modification|change|revision)\b/i.test(evidenceText)) {
    return {
      state: "REQUIRES_HUMAN_REVIEW",
      evidenceText,
      reason:
        "Potential relationship language exists but does not classify the relationship deterministically",
    };
  }

  return {
    state: "UNKNOWN",
    evidenceText,
    reason: "No supported explicit relationship language was found",
  };
}
