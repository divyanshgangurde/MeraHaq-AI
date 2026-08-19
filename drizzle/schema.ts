import {
  boolean,
  float,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table supplied by the application foundation. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const schemes = mysqlTable(
  "schemes",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    name: varchar("name", { length: 512 }).notNull(),
    description: text("description"),
    issuingDepartment: varchar("issuingDepartment", { length: 512 }),
    coverageStatus: mysqlEnum("coverageStatus", [
      "supported",
      "planned",
      "archived",
    ])
      .default("planned")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("schemes_slug_unique").on(table.slug)]
);

export const documents = mysqlTable(
  "documents",
  {
    id: int("id").autoincrement().primaryKey(),
    schemeId: int("schemeId")
      .notNull()
      .references(() => schemes.id),
    title: varchar("title", { length: 1024 }).notNull(),
    documentNumber: varchar("documentNumber", { length: 512 }),
    issuingAuthority: varchar("issuingAuthority", { length: 512 }).notNull(),
    documentType: mysqlEnum("documentType", [
      "guideline",
      "amendment",
      "clarification",
      "corrigendum",
      "notification",
      "order",
      "other",
    ]).notNull(),
    issuedOn: timestamp("issuedOn"),
    effectiveFrom: timestamp("effectiveFrom"),
    effectiveTo: timestamp("effectiveTo"),
    sourceUrl: varchar("sourceUrl", { length: 2048 }).notNull(),
    storageKey: varchar("storageKey", { length: 1024 }),
    extractedTextStorageKey: varchar("extractedTextStorageKey", {
      length: 1024,
    }),
    documentHash: varchar("documentHash", { length: 128 }).notNull(),
    pageCount: int("pageCount"),
    metadataJson: json("metadataJson"),
    isOfficial: boolean("isOfficial").default(false).notNull(),
    processingState: mysqlEnum("processingState", [
      "discovered",
      "stored",
      "extracted",
      "indexed",
      "failed",
    ])
      .default("discovered")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("documents_hash_unique").on(table.documentHash),
    index("documents_scheme_issued_idx").on(table.schemeId, table.issuedOn),
    index("documents_number_idx").on(table.documentNumber),
  ]
);

export const documentArtifacts = mysqlTable(
  "documentArtifacts",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId")
      .notNull()
      .references(() => documents.id),
    artifactType: mysqlEnum("artifactType", [
      "original_pdf",
      "extracted_text",
      "page_image",
    ]).notNull(),
    storageKey: varchar("storageKey", { length: 1024 }).notNull(),
    contentHash: varchar("contentHash", { length: 128 }),
    mimeType: varchar("mimeType", { length: 160 }),
    pageNumber: int("pageNumber"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("artifacts_document_type_idx").on(
      table.documentId,
      table.artifactType
    ),
  ]
);

export const documentReferences = mysqlTable(
  "documentReferences",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceDocumentId: int("sourceDocumentId")
      .notNull()
      .references(() => documents.id),
    candidateDocumentId: int("candidateDocumentId").references(
      () => documents.id
    ),
    referencedNumber: varchar("referencedNumber", { length: 512 }),
    referencedDate: timestamp("referencedDate"),
    evidenceText: text("evidenceText").notNull(),
    pageStart: int("pageStart").notNull(),
    pageEnd: int("pageEnd").notNull(),
    resolutionState: mysqlEnum("resolutionState", [
      "unresolved",
      "matched",
      "ambiguous",
      "rejected",
    ])
      .default("unresolved")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("references_source_idx").on(table.sourceDocumentId)]
);

export const documentRelationships = mysqlTable(
  "documentRelationships",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceDocumentId: int("sourceDocumentId")
      .notNull()
      .references(() => documents.id),
    targetDocumentId: int("targetDocumentId")
      .notNull()
      .references(() => documents.id),
    relationshipType: mysqlEnum("relationshipType", [
      "AMENDS",
      "SUPERSEDES",
      "CORRIGES",
      "REPLACES",
      "REVOKES",
      "EXTENDS",
      "REFERENCES",
      "CONTINUES",
    ]).notNull(),
    scope: text("scope"),
    confidence: float("confidence").notNull(),
    extractionMethod: mysqlEnum("extractionMethod", [
      "deterministic",
      "llm",
      "human",
    ]).notNull(),
    verificationState: mysqlEnum("verificationState", [
      "VERIFIED",
      "AMBIGUOUS",
      "UNVERIFIED",
      "REJECTED",
    ])
      .default("UNVERIFIED")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("relationships_source_idx").on(table.sourceDocumentId),
    index("relationships_target_idx").on(table.targetDocumentId),
  ]
);

export const relationshipEvidence = mysqlTable(
  "relationshipEvidence",
  {
    id: int("id").autoincrement().primaryKey(),
    relationshipId: int("relationshipId")
      .notNull()
      .references(() => documentRelationships.id),
    documentId: int("documentId")
      .notNull()
      .references(() => documents.id),
    evidenceText: text("evidenceText").notNull(),
    normalizedEvidenceText: text("normalizedEvidenceText").notNull(),
    pageStart: int("pageStart").notNull(),
    pageEnd: int("pageEnd").notNull(),
    sourceOffsetStart: int("sourceOffsetStart"),
    sourceOffsetEnd: int("sourceOffsetEnd"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("relationship_evidence_idx").on(table.relationshipId)]
);

export const documentChunks = mysqlTable(
  "documentChunks",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId")
      .notNull()
      .references(() => documents.id),
    chunkIndex: int("chunkIndex").notNull(),
    content: text("content").notNull(),
    pageStart: int("pageStart").notNull(),
    pageEnd: int("pageEnd").notNull(),
    tokenCount: int("tokenCount").notNull(),
    contentHash: varchar("contentHash", { length: 128 }).notNull(),
    embeddingJson: json("embeddingJson"),
    vectorDimensions: int("vectorDimensions"),
    lexicalTerms: json("lexicalTerms").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("chunks_document_index_unique").on(
      table.documentId,
      table.chunkIndex
    ),
    index("chunks_document_pages_idx").on(table.documentId, table.pageStart),
  ]
);

export const lineageAssertions = mysqlTable(
  "lineageAssertions",
  {
    id: int("id").autoincrement().primaryKey(),
    schemeId: int("schemeId")
      .notNull()
      .references(() => schemes.id),
    documentId: int("documentId")
      .notNull()
      .references(() => documents.id),
    status: mysqlEnum("status", [
      "CURRENT_VERIFIED",
      "HISTORICAL",
      "AMBIGUOUS",
      "UNVERIFIED",
    ]).notNull(),
    scope: text("scope"),
    confidence: float("confidence").notNull(),
    basis: json("basis").notNull(),
    computedAt: timestamp("computedAt").defaultNow().notNull(),
  },
  table => [
    index("assertions_scheme_status_idx").on(table.schemeId, table.status),
  ]
);

export const ingestionRuns = mysqlTable(
  "ingestionRuns",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId").references(() => documents.id),
    sourceUrl: varchar("sourceUrl", { length: 2048 }).notNull(),
    state: mysqlEnum("state", ["queued", "processing", "completed", "failed"])
      .default("queued")
      .notNull(),
    steps: json("steps").notNull(),
    errorSummary: text("errorSummary"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  table => [index("ingestion_runs_state_idx").on(table.state)]
);

export const evaluationCases = mysqlTable(
  "evaluationCases",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    schemeId: int("schemeId")
      .notNull()
      .references(() => schemes.id),
    question: text("question").notNull(),
    expectedDocumentIds: json("expectedDocumentIds").notNull(),
    expectedRelationshipTypes: json("expectedRelationshipTypes").notNull(),
    expectedCitationDocumentIds: json("expectedCitationDocumentIds").notNull(),
    expectedVerificationState: mysqlEnum("expectedVerificationState", [
      "VERIFIED",
      "AMBIGUOUS",
      "UNVERIFIED",
    ]).notNull(),
    expectedAnswerNotes: text("expectedAnswerNotes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("evaluation_cases_slug_unique").on(table.slug)]
);

export const evaluationRuns = mysqlTable(
  "evaluationRuns",
  {
    id: int("id").autoincrement().primaryKey(),
    evaluationCaseId: int("evaluationCaseId")
      .notNull()
      .references(() => evaluationCases.id),
    mode: mysqlEnum("mode", ["baseline", "dhruv"]).notNull(),
    retrievedDocumentIds: json("retrievedDocumentIds").notNull(),
    selectedDocumentIds: json("selectedDocumentIds").notNull(),
    answer: text("answer"),
    citations: json("citations").notNull(),
    metrics: json("metrics").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("evaluation_runs_case_mode_idx").on(
      table.evaluationCaseId,
      table.mode
    ),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Scheme = typeof schemes.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentRelationship = typeof documentRelationships.$inferSelect;
