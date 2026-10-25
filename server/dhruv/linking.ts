import { and, asc, eq } from "drizzle-orm";
import {
  documentChunks,
  documentRelationships,
  documents,
  lineageAssertions,
  relationshipEvidence,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { validateEvidenceQuote } from "./evidenceValidation";
import { relationshipVerificationState } from "./ingestion";
import { normalizeDocumentNumber, normalizeText } from "./normalization";
import {
  detectDeterministicRelationship,
  type RelationshipDetection,
} from "./relationshipRules";

/**
 * Sentence-level, target-anchored evidence search for the linker.
 *
 * The original linker ran the deterministic rules over whole 1,200-char
 * chunks and took the first match anywhere in the document. That worked
 * for one-page amendment orders, whose every sentence is about the
 * relationship. It fails on long comprehensive guidelines: a 103-page
 * document is full of annexure boilerplate containing relationship-
 * shaped words ("extension of NLM" is a sub-mission name in an
 * insurance section; "with reference to" appears in bank-guarantee
 * templates), and first-match over the full text manufactures VERIFIED
 * edges from prose that says nothing about the other document
 * (observed live, 2026-10-26, NLM 2025 → 2021).
 *
 * The fix narrows what counts as evidence in two ways:
 *  1. Detection runs per SENTENCE, and the stored evidence is that
 *     sentence — the same unit the ingestion path uses.
 *  2. The sentence must ANCHOR to a document: it must mention the
 *     guidelines (the document class every current target belongs to)
 *     or cite the target's document number. A keyword without an
 *     anchor is topical prose, not a lineage claim.
 * A genuine declaration that names its predecessor only by F. No. is
 * covered by the number anchor; one that does neither is missed on
 * purpose — it falls to the human-review path instead of becoming a
 * false VERIFIED edge. Missing an edge is recoverable; a wrong
 * VERIFIED edge silently rewrites what the corpus claims is current.
 */
export function sentenceAnchorsToDocument(
  sentence: string,
  targetDocumentNumber: string | null
): boolean {
  const normalized = normalizeText(sentence);
  if (normalized.includes("guideline")) return true;
  const number = normalizeDocumentNumber(targetDocumentNumber);
  if (number) {
    const squash = (value: string) =>
      value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (squash(sentence).includes(squash(number))) return true;
  }
  return false;
}

export type AnchoredEvidence = {
  kind: "matched" | "ambiguous";
  evidenceText: string;
  sourceText: string;
  pageStart: number;
  pageEnd: number;
  detection: RelationshipDetection;
};

export function findAnchoredRelationshipEvidence(
  chunks: Array<{ content: string; pageStart: number; pageEnd: number }>,
  targetDocumentNumber: string | null
): AnchoredEvidence | null {
  let ambiguous: AnchoredEvidence | null = null;
  for (const chunk of chunks) {
    const sentences = chunk.content
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length >= 20);
    for (const sentence of sentences) {
      if (!sentenceAnchorsToDocument(sentence, targetDocumentNumber)) {
        continue;
      }
      const detection = detectDeterministicRelationship(sentence);
      if (detection.state === "MATCHED") {
        return {
          kind: "matched",
          evidenceText: sentence,
          sourceText: chunk.content,
          pageStart: chunk.pageStart,
          pageEnd: chunk.pageEnd,
          detection,
        };
      }
      if (detection.state === "REQUIRES_HUMAN_REVIEW" && !ambiguous) {
        ambiguous = {
          kind: "ambiguous",
          evidenceText: sentence,
          sourceText: chunk.content,
          pageStart: chunk.pageStart,
          pageEnd: chunk.pageEnd,
          detection,
        };
      }
    }
  }
  return ambiguous;
}

export async function linkIndexedDocuments(input: {
  sourceDocumentId: number;
  targetDocumentId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const source = await db
    .select()
    .from(documents)
    .where(eq(documents.id, input.sourceDocumentId))
    .limit(1);
  const target = await db
    .select()
    .from(documents)
    .where(eq(documents.id, input.targetDocumentId))
    .limit(1);
  if (!source[0] || !target[0])
    throw new Error("Both source and target documents must exist");
  if (source[0].schemeId !== target[0].schemeId) {
    throw new Error("Related documents must belong to the same scheme");
  }

  const existing = await db
    .select()
    .from(documentRelationships)
    .where(
      and(
        eq(documentRelationships.sourceDocumentId, source[0].id),
        eq(documentRelationships.targetDocumentId, target[0].id)
      )
    )
    .limit(1);
  if (existing[0] && existing[0].verificationState !== "REJECTED") {
    return { relationship: existing[0], deduplicated: true };
  }

  const chunks = await db
    .select()
    .from(documentChunks)
    .where(eq(documentChunks.documentId, source[0].id))
    .orderBy(asc(documentChunks.chunkIndex));
  const candidate = findAnchoredRelationshipEvidence(
    chunks.map(chunk => ({
      content: chunk.content,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
    })),
    target[0].documentNumber
  );
  const validation =
    candidate?.kind === "matched"
      ? validateEvidenceQuote({
          sourceText: candidate.sourceText,
          evidenceText: candidate.evidenceText,
          pageStart: candidate.pageStart,
          pageEnd: candidate.pageEnd,
        })
      : null;
  const verificationState =
    candidate?.kind === "matched"
      ? relationshipVerificationState(
          candidate.evidenceText,
          Boolean(validation?.valid)
        )
      : candidate?.kind === "ambiguous"
        ? ("AMBIGUOUS" as const)
        : ("REJECTED" as const);
  const matchedDetection =
    candidate?.kind === "matched" && candidate.detection.state === "MATCHED"
      ? candidate.detection
      : null;
  const relationshipValues = {
    sourceDocumentId: source[0].id,
    targetDocumentId: target[0].id,
    relationshipType: matchedDetection
      ? matchedDetection.relationshipType
      : ("REFERENCES" as const),
    scope: matchedDetection
      ? matchedDetection.scope
      : verificationState === "AMBIGUOUS"
        ? "Potential relationship requires human review"
        : "No evidence-backed relationship classification was found",
    confidence:
      matchedDetection && validation?.valid ? matchedDetection.confidence : 0,
    extractionMethod: "deterministic" as const,
    verificationState,
  };
  const relationshipId = existing[0]
    ? existing[0].id
    : Number(
        (await db.insert(documentRelationships).values(relationshipValues))[0]
          .insertId
      );
  if (existing[0]) {
    await db
      .update(documentRelationships)
      .set(relationshipValues)
      .where(eq(documentRelationships.id, relationshipId));
  }
  if (matchedDetection && validation?.valid && candidate) {
    await db.insert(relationshipEvidence).values({
      relationshipId,
      documentId: source[0].id,
      evidenceText: candidate.evidenceText,
      normalizedEvidenceText: validation.normalizedEvidence,
      pageStart: candidate.pageStart,
      pageEnd: candidate.pageEnd,
    });
  }
  if (verificationState === "AMBIGUOUS") {
    await db.insert(lineageAssertions).values({
      schemeId: source[0].schemeId,
      documentId: source[0].id,
      status: "AMBIGUOUS",
      scope: "indexed-document relationship pending human review",
      confidence: 0,
      basis: { targetDocumentId: target[0].id },
    });
  }
  const inserted = await db
    .select()
    .from(documentRelationships)
    .where(eq(documentRelationships.id, relationshipId))
    .limit(1);
  return { relationship: inserted[0], deduplicated: false };
}
