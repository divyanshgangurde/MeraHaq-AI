import type {
  LineageStatus,
  RelationshipRecord,
  SourceDocument,
} from "./domain";

const invalidatingRelationships = new Set([
  "SUPERSEDES",
  "REPLACES",
  "REVOKES",
]);

export function determineLineageStatus(
  documents: SourceDocument[],
  relationships: RelationshipRecord[]
): Map<number, LineageStatus> {
  const status = new Map<number, LineageStatus>();
  for (const document of documents) {
    status.set(
      document.id,
      document.isOfficial ? "CURRENT_VERIFIED" : "UNVERIFIED"
    );
  }

  for (const relationship of relationships) {
    if (relationship.verificationState === "AMBIGUOUS") {
      const current = status.get(relationship.targetDocumentId);
      if (current !== "HISTORICAL")
        status.set(relationship.targetDocumentId, "AMBIGUOUS");
      continue;
    }
    if (relationship.verificationState !== "VERIFIED") continue;
    if (invalidatingRelationships.has(relationship.relationshipType)) {
      status.set(relationship.targetDocumentId, "HISTORICAL");
    }
  }

  return status;
}

export function selectApplicableDocumentIds(
  candidateDocumentIds: number[],
  statuses: Map<number, LineageStatus>,
  intent: "current" | "history"
): number[] {
  if (intent === "history") return candidateDocumentIds;
  return candidateDocumentIds.filter(id => {
    const status = statuses.get(id);
    return (
      status === "CURRENT_VERIFIED" ||
      status === "AMBIGUOUS" ||
      status === "UNVERIFIED"
    );
  });
}

export type LineageGraph = {
  nodes: Array<{
    id: number;
    title: string;
    issuedOn: Date | null;
    status: LineageStatus;
    isOfficial: boolean;
  }>;
  edges: Array<{
    sourceDocumentId: number;
    targetDocumentId: number;
    relationshipType: RelationshipRecord["relationshipType"];
    verificationState: RelationshipRecord["verificationState"];
    confidence: number;
  }>;
};

export function buildLineageGraph(
  documents: SourceDocument[],
  relationships: RelationshipRecord[]
): LineageGraph {
  const statuses = determineLineageStatus(documents, relationships);
  return {
    nodes: documents
      .map(document => ({
        id: document.id,
        title: document.title,
        issuedOn: document.issuedOn ?? null,
        status: statuses.get(document.id) ?? "UNVERIFIED",
        isOfficial: document.isOfficial,
      }))
      .sort((left, right) => left.id - right.id),
    edges: relationships
      .filter(relationship => relationship.verificationState !== "REJECTED")
      .map(relationship => ({
        sourceDocumentId: relationship.sourceDocumentId,
        targetDocumentId: relationship.targetDocumentId,
        relationshipType: relationship.relationshipType,
        verificationState: relationship.verificationState,
        confidence: relationship.confidence,
      })),
  };
}
