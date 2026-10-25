/**
 * Print the lineage graph (nodes + verified edges + computed statuses) for
 * every document in the corpus, using the same buildLineageGraph the app
 * uses. Handy for verifying that documents are actually linked in the
 * graph after seeding.
 *
 * Usage: DATABASE_URL=... pnpm exec tsx scripts/graph-dump.ts
 */
import { documentRelationships, documents } from "../drizzle/schema";
import { getDb } from "../server/db";
import { buildLineageGraph } from "../server/dhruv/lineage";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Set DATABASE_URL.");
  const docs = await db.select().from(documents);
  const rels = await db.select().from(documentRelationships);
  const graph = buildLineageGraph(
    docs.map(doc => ({
      id: doc.id,
      schemeId: doc.schemeId,
      title: doc.title,
      sourceUrl: doc.sourceUrl,
      issuedOn: doc.issuedOn,
      isOfficial: doc.isOfficial,
    })),
    rels.map(rel => ({
      sourceDocumentId: rel.sourceDocumentId,
      targetDocumentId: rel.targetDocumentId,
      relationshipType: rel.relationshipType,
      verificationState: rel.verificationState,
      confidence: rel.confidence,
      evidenceText: "",
    })),
  );
  console.log(JSON.stringify(graph, null, 1));
  process.exit(0);
}

main().catch(error => {
  console.error("[graph] failed:", error);
  process.exit(1);
});
