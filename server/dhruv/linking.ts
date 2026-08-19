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
import { detectDeterministicRelationship } from "./relationshipRules";

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
  const candidate = chunks
    .map(chunk => ({
      chunk,
      detection: detectDeterministicRelationship(chunk.content),
    }))
    .find(item => item.detection.state === "MATCHED");
  const validation = candidate
    ? validateEvidenceQuote({
        sourceText: candidate.chunk.content,
        evidenceText: candidate.detection.evidenceText,
        pageStart: candidate.chunk.pageStart,
        pageEnd: candidate.chunk.pageEnd,
      })
    : null;
  const verificationState = relationshipVerificationState(
    candidate?.chunk.content ?? "",
    Boolean(validation?.valid)
  );
  const relationshipValues = {
    sourceDocumentId: source[0].id,
    targetDocumentId: target[0].id,
    relationshipType:
      candidate?.detection.state === "MATCHED"
        ? candidate.detection.relationshipType
        : ("REFERENCES" as const),
    scope:
      candidate?.detection.state === "MATCHED"
        ? candidate.detection.scope
        : verificationState === "AMBIGUOUS"
          ? "Potential relationship requires human review"
          : "No evidence-backed relationship classification was found",
    confidence:
      candidate?.detection.state === "MATCHED" && validation?.valid
        ? candidate.detection.confidence
        : 0,
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
  if (candidate?.detection.state === "MATCHED" && validation?.valid) {
    await db.insert(relationshipEvidence).values({
      relationshipId,
      documentId: source[0].id,
      evidenceText: candidate.detection.evidenceText,
      normalizedEvidenceText: validation.normalizedEvidence,
      pageStart: candidate.chunk.pageStart,
      pageEnd: candidate.chunk.pageEnd,
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
