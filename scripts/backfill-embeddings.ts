/**
 * Backfill real embeddings (and the document semantic-term profile) for
 * chunks ingested before the vector path existed or while no LLM key was
 * configured. Safe to re-run: chunks that already carry a vector of the
 * configured model's dimensionality are skipped.
 *
 * Usage:
 *   DATABASE_URL=... LLM_API_KEY=... pnpm exec tsx scripts/backfill-embeddings.ts
 */
import { asc, eq } from "drizzle-orm";
import { documentChunks, documents } from "../drizzle/schema";
import { getDb } from "../server/db";
import { createEmbeddings } from "../server/_core/llm";
import { createSemanticProfile } from "../server/dhruv/semantic";

type StoredProfile = {
  terms?: unknown;
  embedding?: unknown;
};

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available. Set DATABASE_URL.");

  const docs = await db.select().from(documents);
  for (const doc of docs) {
    const chunks = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, doc.id))
      .orderBy(asc(documentChunks.chunkIndex));
    if (chunks.length === 0) continue;

    const needsVector = chunks.filter(chunk => {
      const profile = chunk.embeddingJson as StoredProfile | null;
      return !Array.isArray(profile?.embedding);
    });
    console.log(
      `[backfill] ${doc.title}: ${chunks.length} chunks, ${needsVector.length} need vectors`,
    );
    if (needsVector.length === 0) continue;

    const vectors = await createEmbeddings(
      needsVector.map(chunk => chunk.content),
    );
    if (!vectors) {
      console.log("[backfill] embedding provider unavailable, skipping");
      continue;
    }

    // Refresh the document-level term profile from the indexed text so the
    // term-overlap half of ranking also works for pre-key ingestions.
    const sampleText = chunks
      .slice(0, 12)
      .map(chunk => chunk.content)
      .join("\n")
      .slice(0, 6_000);
    const profile = await createSemanticProfile(sampleText);

    for (const [index, chunk] of needsVector.entries()) {
      const existing = (chunk.embeddingJson as StoredProfile | null) ?? {};
      const existingTerms = Array.isArray(existing.terms)
        ? (existing.terms as unknown[]).filter(
            (term): term is string => typeof term === "string",
          )
        : [];
      const terms = existingTerms.length > 0 ? existingTerms : profile.terms;
      await db
        .update(documentChunks)
        .set({
          embeddingJson: { terms, embedding: vectors[index] },
          vectorDimensions: vectors[index].length,
        })
        .where(eq(documentChunks.id, chunk.id));
    }
    console.log(
      `[backfill]   -> wrote ${vectors.length} vectors (${vectors[0]?.length} dims), terms profile: ${profile.terms.length} terms`,
    );
  }
  console.log("[backfill] done");
  process.exit(0);
}

main().catch(error => {
  console.error("[backfill] failed:", error);
  process.exit(1);
});
