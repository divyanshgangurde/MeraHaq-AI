/**
 * Local corpus seed (de-Manus workflow B).
 *
 * Inserts the curated VERIFIED_SOURCE_CHAIN schemes and ingests their
 * official PDFs through the real ingestion pipeline (download -> hash ->
 * page-aware extraction -> local storage -> chunking -> lineage detection),
 * so a local/off-Manus deployment gets a genuine, verifiable corpus instead
 * of demo data.
 *
 * Usage:
 *   DATABASE_URL=mysql://user:pass@localhost:3306/merahaq \
 *   pnpm exec tsx scripts/seed-local.ts [--only <schemeSlug>]
 *
 * An LLM key (LLM_API_KEY) is NOT required: semantic profiling degrades to
 * an empty term profile and retrieval falls back to lexical ranking.
 * Re-running is safe: schemes are upserted by slug and documents are
 * deduplicated by content hash inside the ingestion pipeline.
 *
 * Byte-cache fallback: some official hosts cannot be fetched directly from
 * every network (pmkisan.gov.in drops this VM's non-browser fetches with an
 * empty reply, and the rebuilt dahd.gov.in returns 404 for the pre-rebuild
 * NLM guideline URL). When a direct fetch fails, the seed retries with
 * authentic bytes of the exact official URL listed in
 * data/source-cache/manifest.json (Internet Archive snapshots of the
 * official URLs, with sha256 recorded in the manifest). The document's
 * recorded sourceUrl and hash are unchanged; the retrieval path is logged
 * here and stored on the ingestion run. A document whose bytes cannot be
 * obtained either way is logged as FAILED and skipped, not fatal.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import {
  documentRelationships,
  documents,
  lineageAssertions,
  schemes,
} from "../drizzle/schema";
import { getDb } from "../server/db";
import { curatedChains } from "../server/dhruv/curatedChains";
import { ingestOfficialPdf } from "../server/dhruv/ingestion";
import { determineLineageStatus } from "../server/dhruv/lineage";
import { linkIndexedDocuments } from "../server/dhruv/linking";

type SourceCacheEntry = { file: string; retrievedVia: string };

function loadSourceCache(): Map<string, SourceCacheEntry & { absPath: string }> {
  const cacheDir = path.join(process.cwd(), "data", "source-cache");
  const manifestPath = path.join(cacheDir, "manifest.json");
  const cache = new Map<string, SourceCacheEntry & { absPath: string }>();
  if (!existsSync(manifestPath)) return cache;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    entries?: Record<string, SourceCacheEntry>;
  };
  for (const [sourceUrl, entry] of Object.entries(manifest.entries ?? {})) {
    const absPath = path.join(cacheDir, entry.file);
    if (existsSync(absPath)) cache.set(sourceUrl, { ...entry, absPath });
  }
  return cache;
}

const ISSUING_AUTHORITY: Record<string, string> = {
  "jal-jeevan-mission": "Jal Jeevan Mission, Ministry of Jal Shakti",
  "pm-kisan": "Ministry of Agriculture and Farmers Welfare",
  "national-livestock-mission":
    "Department of Animal Husbandry and Dairying",
};

async function main() {
  const onlyIdx = process.argv.indexOf("--only");
  const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;

  const db = await getDb();
  if (!db) {
    throw new Error(
      "Database is not available. Set DATABASE_URL (see .env.example).",
    );
  }

  const sourceCache = loadSourceCache();

  const chains = curatedChains.filter(
    chain =>
      chain.status === "VERIFIED_SOURCE_CHAIN" &&
      (!only || chain.schemeSlug === only),
  );
  if (chains.length === 0) {
    throw new Error(`No verified curated chain matches --only ${only}`);
  }

  for (const chain of chains) {
    const existing = await db
      .select()
      .from(schemes)
      .where(eq(schemes.slug, chain.schemeSlug))
      .limit(1);
    if (!existing[0]) {
      await db.insert(schemes).values({
        slug: chain.schemeSlug,
        name: chain.schemeName,
        coverageStatus: "supported",
      });
      console.log(`[seed] scheme inserted: ${chain.schemeSlug}`);
    } else {
      console.log(`[seed] scheme exists: ${chain.schemeSlug}`);
    }

    let previousDocumentId: number | undefined;
    const ingestedIds: number[] = [];
    for (const [index, doc] of chain.documents.entries()) {
      console.log(`[seed] ingesting: ${doc.title}`);
      const ingestArgs = {
        schemeSlug: chain.schemeSlug,
        title: doc.title,
        issuingAuthority:
          ISSUING_AUTHORITY[chain.schemeSlug] ?? "Government of India",
        // Explicit per-document type wins; the position-based default is
        // only a fallback for the original entries (a consolidated
        // revision is a guideline, not an amendment).
        documentType: (doc.documentType ??
          (index === 0 ? "guideline" : "amendment")) as
          | "guideline"
          | "amendment"
          | "clarification"
          | "corrigendum"
          | "notification"
          | "order"
          | "other",
        sourceUrl: doc.sourceUrl,
        issuedOn: doc.issuedOn
          ? new Date(`${doc.issuedOn}T00:00:00.000Z`)
          : undefined,
        relatedDocumentId: index > 0 ? previousDocumentId : undefined,
      };
      let result: Awaited<ReturnType<typeof ingestOfficialPdf>> | null = null;
      try {
        result = await ingestOfficialPdf(ingestArgs);
      } catch (directError) {
        const cached = sourceCache.get(doc.sourceUrl);
        if (!cached) {
          console.log(
            `[seed]   FAILED (direct fetch, no cached bytes): ` +
              `${directError instanceof Error ? directError.message : directError}`,
          );
        } else {
          console.log(
            `[seed]   direct fetch failed (${directError instanceof Error ? directError.message : directError}); ` +
              `retrying with cached bytes: ${cached.retrievedVia}`,
          );
          try {
            result = await ingestOfficialPdf({
              ...ingestArgs,
              localBytesPath: cached.absPath,
              byteSourceNote: cached.retrievedVia,
            });
          } catch (cacheError) {
            console.log(
              `[seed]   FAILED (cached bytes): ` +
                `${cacheError instanceof Error ? cacheError.message : cacheError}`,
            );
          }
        }
      }
      if (!result) {
        // Skip this document but keep seeding the rest of the chain. The
        // linker below only runs for consecutively ingested pairs.
        previousDocumentId = undefined;
        continue;
      }
      previousDocumentId = result.document.id;
      ingestedIds.push(result.document.id);
      console.log(
        `[seed]   -> document id ${result.document.id}` +
          (result.deduplicated ? " (deduplicated, already indexed)" : ""),
      );
    }

    // Ingestion alone only persists a relationship when a reference
    // candidate on the title/early pages matches deterministically. The
    // chunk-level linker is the second pass the hosted version relied on;
    // run it for each consecutive pair so lineage edges are evidence-checked
    // against the full indexed text.
    for (let i = 1; i < ingestedIds.length; i++) {
      const linked = await linkIndexedDocuments({
        sourceDocumentId: ingestedIds[i],
        targetDocumentId: ingestedIds[i - 1],
      });
      console.log(
        `[seed] link ${ingestedIds[i]} -> ${ingestedIds[i - 1]}: ` +
          `${linked.relationship.relationshipType} / ` +
          `${linked.relationship.verificationState}`,
      );
    }

    // Materialize current-applicability assertions. The answer path reads
    // lineageAssertions from the DB and defaults a document to UNVERIFIED
    // when no row exists; nothing upstream writes the deterministic result.
    // Compute it with the same determineLineageStatus the research design
    // specifies (official documents are CURRENT_VERIFIED unless a VERIFIED
    // SUPERSEDES / REPLACES / REVOKES edge makes them HISTORICAL, or an
    // AMBIGUOUS edge leaves them AMBIGUOUS) and persist it, replacing only
    // assertions previously written by this seed.
    const schemeRow = await db
      .select()
      .from(schemes)
      .where(eq(schemes.slug, chain.schemeSlug))
      .limit(1);
    const schemeDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.schemeId, schemeRow[0].id));
    const schemeRels = await db
      .select()
      .from(documentRelationships)
      .where(
        inArray(
          documentRelationships.sourceDocumentId,
          schemeDocs.map(doc => doc.id),
        ),
      );
    const statuses = determineLineageStatus(
      schemeDocs.map(doc => ({
        id: doc.id,
        schemeId: doc.schemeId,
        title: doc.title,
        sourceUrl: doc.sourceUrl,
        issuedOn: doc.issuedOn,
        isOfficial: doc.isOfficial,
      })),
      schemeRels.map(rel => ({
        sourceDocumentId: rel.sourceDocumentId,
        targetDocumentId: rel.targetDocumentId,
        relationshipType: rel.relationshipType,
        verificationState: rel.verificationState,
        confidence: rel.confidence,
        evidenceText: "",
      })),
    );
    for (const doc of schemeDocs) {
      const prior = await db
        .select()
        .from(lineageAssertions)
        .where(eq(lineageAssertions.documentId, doc.id));
      for (const row of prior) {
        const basis = row.basis as { source?: string } | null;
        if (basis?.source === "seed-local") {
          await db
            .delete(lineageAssertions)
            .where(eq(lineageAssertions.id, row.id));
        }
      }
      // A document that already carries a non-seed assertion (e.g. an
      // AMBIGUOUS one awaiting human review) is left untouched.
      const hasExternalAssertion = prior.some(
        row =>
          (row.basis as { source?: string } | null)?.source !== "seed-local",
      );
      if (hasExternalAssertion) continue;
      const status = statuses.get(doc.id) ?? "UNVERIFIED";
      await db.insert(lineageAssertions).values({
        schemeId: schemeRow[0].id,
        documentId: doc.id,
        status,
        scope:
          "Current-applicability computed deterministically from official status and verified relationships (seed-local).",
        confidence: status === "CURRENT_VERIFIED" ? 0.95 : 0.5,
        basis: {
          source: "seed-local",
          via: "determineLineageStatus",
          relationshipIds: schemeRels
            .filter(
              rel =>
                rel.sourceDocumentId === doc.id ||
                rel.targetDocumentId === doc.id,
            )
            .map(rel => rel.id),
        },
      });
      console.log(`[seed] lineage assertion: doc ${doc.id} -> ${status}`);
    }
  }

  console.log("[seed] done");
  process.exit(0);
}

main().catch(error => {
  console.error("[seed] failed:", error);
  process.exit(1);
});
