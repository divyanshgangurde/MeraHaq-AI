export const relationshipTypes = [
  "AMENDS",
  "SUPERSEDES",
  "CORRIGES",
  "REPLACES",
  "REVOKES",
  "EXTENDS",
  "REFERENCES",
  "CONTINUES",
] as const;

export type RelationshipType = (typeof relationshipTypes)[number];
export type VerificationState =
  | "VERIFIED"
  | "AMBIGUOUS"
  | "UNVERIFIED"
  | "REJECTED";
export type LineageStatus =
  | "CURRENT_VERIFIED"
  | "HISTORICAL"
  | "AMBIGUOUS"
  | "UNVERIFIED";

export type SourceDocument = {
  id: number;
  schemeId: number;
  title: string;
  sourceUrl: string;
  issuedOn?: Date | null;
  isOfficial: boolean;
};

export type RelationshipRecord = {
  sourceDocumentId: number;
  targetDocumentId: number;
  relationshipType: RelationshipType;
  verificationState: VerificationState;
  confidence: number;
  evidenceText: string;
};

export type CitationCandidate = {
  documentId: number;
  sourceUrl: string;
  pageStart: number;
  pageEnd: number;
  quote: string;
  sourceText: string;
};
