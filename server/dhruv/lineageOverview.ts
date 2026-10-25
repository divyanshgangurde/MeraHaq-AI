import { eq, inArray } from "drizzle-orm";
import {
  documentRelationships,
  documents,
  schemes,
} from "../../drizzle/schema";
import { getDb } from "../db";
import type { RelationshipRecord, SourceDocument } from "./domain";
import { buildLineageGraph } from "./lineage";

export type LineageOverviewNode = {
  id: number;
  title: string;
  documentType: string;
  issuingAuthority: string;
  issuedOn: string | null;
  sourceUrl: string;
  isOfficial: boolean;
  status: string;
};

export type LineageOverviewEdge = {
  sourceDocumentId: number;
  targetDocumentId: number;
  relationshipType: string;
  verificationState: string;
  confidence: number;
};

export type LineageOverviewScheme = {
  schemeSlug: string;
  schemeName: string;
  nodes: LineageOverviewNode[];
  edges: LineageOverviewEdge[];
};

/**
 * The real, verified lineage graph for every supported scheme, shaped for
 * display. Built from the same documents/relationships the answering path
 * validates against — no curated or placeholder data.
 */
export async function getLineageOverview(): Promise<LineageOverviewScheme[]> {
  const db = await getDb();
  if (!db) return [];

  const supportedSchemes = await db
    .select({ id: schemes.id, slug: schemes.slug, name: schemes.name })
    .from(schemes)
    .where(eq(schemes.coverageStatus, "supported"));
  if (supportedSchemes.length === 0) return [];

  const schemeIds = supportedSchemes.map(scheme => scheme.id);
  const docs = await db
    .select({
      id: documents.id,
      schemeId: documents.schemeId,
      title: documents.title,
      documentType: documents.documentType,
      issuingAuthority: documents.issuingAuthority,
      issuedOn: documents.issuedOn,
      sourceUrl: documents.sourceUrl,
      isOfficial: documents.isOfficial,
    })
    .from(documents)
    .where(inArray(documents.schemeId, schemeIds));
  if (docs.length === 0) return [];

  const docIds = docs.map(doc => doc.id);
  const rels = await db
    .select({
      sourceDocumentId: documentRelationships.sourceDocumentId,
      targetDocumentId: documentRelationships.targetDocumentId,
      relationshipType: documentRelationships.relationshipType,
      verificationState: documentRelationships.verificationState,
      confidence: documentRelationships.confidence,
      scope: documentRelationships.scope,
    })
    .from(documentRelationships)
    .where(inArray(documentRelationships.sourceDocumentId, docIds));

  return supportedSchemes
    .map(scheme => {
      const schemeDocs = docs.filter(doc => doc.schemeId === scheme.id);
      const schemeDocIds = new Set(schemeDocs.map(doc => doc.id));
      const schemeRels = rels.filter(
        rel =>
          schemeDocIds.has(rel.sourceDocumentId) &&
          schemeDocIds.has(rel.targetDocumentId)
      );
      const graph = buildLineageGraph(
        schemeDocs.map(
          (doc): SourceDocument => ({
            id: doc.id,
            schemeId: doc.schemeId,
            title: doc.title,
            sourceUrl: doc.sourceUrl,
            issuedOn: doc.issuedOn,
            isOfficial: doc.isOfficial,
          })
        ),
        schemeRels.map(
          (rel): RelationshipRecord => ({
            sourceDocumentId: rel.sourceDocumentId,
            targetDocumentId: rel.targetDocumentId,
            relationshipType: rel.relationshipType,
            verificationState: rel.verificationState,
            confidence: rel.confidence,
            evidenceText: rel.scope ?? "",
          })
        )
      );
      const docById = new Map(schemeDocs.map(doc => [doc.id, doc]));
      return {
        schemeSlug: scheme.slug,
        schemeName: scheme.name,
        nodes: graph.nodes.map(node => {
          const doc = docById.get(node.id);
          return {
            id: node.id,
            title: node.title,
            documentType: doc?.documentType ?? "other",
            issuingAuthority: doc?.issuingAuthority ?? "",
            issuedOn: doc?.issuedOn ? doc.issuedOn.toISOString() : null,
            sourceUrl: doc?.sourceUrl ?? "",
            isOfficial: node.isOfficial,
            status: node.status,
          };
        }),
        edges: graph.edges.map(edge => ({
          sourceDocumentId: edge.sourceDocumentId,
          targetDocumentId: edge.targetDocumentId,
          relationshipType: edge.relationshipType,
          verificationState: edge.verificationState,
          confidence: edge.confidence,
        })),
      };
    })
    .filter(scheme => scheme.nodes.length > 0);
}
