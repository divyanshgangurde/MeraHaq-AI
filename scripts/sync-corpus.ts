/**
 * Corpus sync — increment 1: discovery dry-run (CORPUS_SYNC.md).
 *
 * Polls every watchlist listing page, extracts its official PDF links,
 * and diffs them against the URLs the corpus already tracks. Prints a
 * report of NEW (on an official listing, tracked nowhere), NOT-SEEN
 * (tracked, absent from this listing — informational), and BLOCKED
 * (listing unreachable from this network) sources.
 *
 * This script writes NOTHING: no database rows, no ingestion, no
 * lineage changes. Its job is to make staleness impossible to miss.
 * Increments 2–4 (auto-ingest of changed bytes at known URLs,
 * generalised auto-linking, GitHub Actions scheduling) build on the
 * same watchlist/discovery layer — see CORPUS_SYNC.md.
 *
 * Usage:
 *   pnpm exec tsx scripts/sync-corpus.ts [--only <schemeSlug>]
 *   pnpm exec tsx scripts/sync-corpus.ts --wayback   (also fingerprint
 *        known document URLs against their latest Wayback capture)
 */
import { checkListing, diffLinkSets, latestWaybackSnapshot } from "../server/dhruv/discovery";
import { corpusWatchlist } from "../server/dhruv/watchlist";

async function main() {
  const onlyIdx = process.argv.indexOf("--only");
  const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;
  const withWayback = process.argv.includes("--wayback");

  const watches = corpusWatchlist.filter(
    watch => !only || watch.schemeSlug === only
  );
  if (watches.length === 0) {
    throw new Error(`No watchlist entry matches --only ${only}`);
  }

  console.log(`[sync] discovery dry-run — ${new Date().toISOString()}`);
  console.log(`[sync] mode: READ-ONLY (no ingestion, no database writes)`);
  let blockedCount = 0;
  let newCount = 0;

  for (const watch of watches) {
    console.log(`\n[sync] scheme: ${watch.schemeSlug} (cadence ${watch.cadenceDays}d)`);
    for (const listingUrl of watch.listingUrls) {
      const check = await checkListing(listingUrl);
      if (!check.ok) {
        blockedCount += 1;
        console.log(`[sync]   BLOCKED ${listingUrl} — ${check.reason}`);
        continue;
      }
      const diff = diffLinkSets(watch.knownDocumentUrls, check.links);
      console.log(
        `[sync]   ${listingUrl} — HTTP ${check.status}, ` +
          `${check.links.length} official PDF links, fingerprint ${check.fingerprint.slice(0, 12)}…`
      );
      console.log(
        `[sync]     known documents seen: ${diff.seenCount}/${watch.knownDocumentUrls.length}`
      );
      for (const url of diff.added) {
        newCount += 1;
        console.log(`[sync]     NEW (untracked): ${url}`);
      }
      for (const url of diff.notSeen) {
        console.log(`[sync]     not on this listing: ${url}`);
      }
    }
    if (withWayback) {
      for (const docUrl of watch.knownDocumentUrls) {
        const snap = await latestWaybackSnapshot(docUrl);
        console.log(
          snap
            ? `[sync]   wayback ${docUrl} — latest capture ${snap.timestamp}, digest ${snap.digest ?? "n/a"}`
            : `[sync]   wayback ${docUrl} — no capture found`
        );
      }
    }
  }

  console.log(
    `\n[sync] done: ${newCount} untracked document(s) on official listings, ` +
      `${blockedCount} blocked listing(s). Nothing was ingested or written.`
  );
  process.exit(0);
}

main().catch(error => {
  console.error("[sync] failed:", error);
  process.exit(1);
});
