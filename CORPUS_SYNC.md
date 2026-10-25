# Keeping the Corpus Current — Self-Updating Pipeline Spec

**Status:** increment 1 implemented (discovery dry-run). Increments 2–4 designed, not yet built.
**Research basis:** internal report, 2026-10-26 (discovery channels, change detection, auto-linking ladder, platform limits — all verified against primary sources during that research).

## The problem, in one paragraph

The corpus was a snapshot: `curatedChains.ts` hardcoded document URLs, `seed-local.ts` ingested exactly those, and nothing ever looked again. All three launch schemes then published newer governing documents — NLM's Comprehensive Operational Guidelines (January 2025), PM-KISAN's consolidated revised guidelines (March 2020, missed even earlier), JJM's move to 2.0 — while the system kept answering from the old documents with full confidence. For this product that is the worst possible failure mode: a stale document, faithfully summarised, is fully grounded and fully wrong. The stale-answer rate is the release-blocking metric; everything below exists to drive it down without driving false-supersession up.

## Design (Option A — repo-native sync on GitHub Actions)

A runner-agnostic sync script (`scripts/sync-corpus.ts`) driven by a watchlist manifest (`server/dhruv/watchlist.ts`), run weekly by GitHub Actions (free on this public repo; no 60-second function cap). Vercel Cron was evaluated and disqualified as the worker (Hobby plan: once/day max, ±59-minute precision, 60 s function cap vs. minutes-long ingest of 100+ page PDFs) — it may at most check a heartbeat. The sync script reuses the existing inner pipeline, which was already autonomy-ready: SHA-256 dedupe in `ingestOfficialPdf`, the gov.in/nic.in-only rule, deterministic relationship rules with verbatim-evidence validation, and the `AMBIGUOUS` state for human review. What was missing is only the outer loop built here.

### Components

| Piece | File | State |
|---|---|---|
| Watchlist manifest | `server/dhruv/watchlist.ts` | ✅ built — per scheme: listing URLs, known document URLs, signal URLs, cadence, fetch preference |
| Discovery + fingerprints | `server/dhruv/discovery.ts` | ✅ built — listing fetch, official-PDF link extraction, sorted link-set SHA-256 fingerprint, link-set diff, Wayback CDX latest-capture digest |
| Sync orchestrator | `scripts/sync-corpus.ts` | ✅ dry-run mode — reports NEW / not-seen / BLOCKED per source, writes nothing |
| Target resolution ladder | `server/dhruv/resolveTargets.ts` | ⏳ increment 3 |
| Watch state table | `sourceWatchStates` (drizzle) | ⏳ increment 4 — until then, run reports are the record |
| Scheduler | `.github/workflows/corpus-sync.yml` | ⏳ increment 4 — weekly + `workflow_dispatch`, heartbeat guard against GitHub's 60-day inactivity disable |

### Change detection (two tiers, in order)

1. **Listing fingerprint** — the sorted set of official PDF links on each listing page, hashed. A change means something was published, moved, or removed; the diff names exactly what.
2. **Document fingerprint** — byte SHA-256 first (already the corpus dedupe key), then *extracted-text* hash. Government PDFs are frequently re-generated with identical content; only a text-hash change creates candidate lineage work. Wayback capture digests give the same signal for a known URL without downloading the PDF.

### Auto-linking ladder (cheapest first, per new document)

1. **Document-number match** — `extractReferenceCandidates()` already captures the referenced F. No./order number from citing sentences; matching it against `documents.documentNumber` resolves the target deterministically. (This field was captured but never used for resolution before this design.)
2. **Title-phrase match** — the new document's self-declaration ("Amendment in the Operational Guidelines of …") ranked against same-scheme titles by token overlap.
3. **All-pairs deterministic scan** — generalise `linkIndexedDocuments` from consecutive human-named pairs to every same-scheme pair, keeping the verbatim-quote validation gate per edge.
4. **LLM proposal, validator disposal** — only for pairs still unresolved: the model must return a relationship type plus a verbatim quote and page; the quote passes through the *same* `validateEvidenceQuote` gate. Unverifiable output becomes `AMBIGUOUS`, never `VERIFIED`.

### Approval policy (the autonomy dial)

- **Auto-promote:** unchanged re-issues (text-hash equal); new documents whose edges are all deterministic-VERIFIED and non-destructive (AMENDS / EXTENDS / CONTINUES / REFERENCES); lineage recomputation downstream of those.
- **Always human:** SUPERSEDES / REVOKES / REPLACES edges (they flip a document to HISTORICAL — the highest-stakes write in the system); LLM-proposed edges; OCR-derived evidence; any document from a host not previously seen for that scheme.
- The queue stays small by construction — these schemes publish a handful of documents a year. Gate the destructive writes; automate everything else.

### Freshness disclosure

Per scheme, the last successful watch is recorded (increment 4). When a scheme has an unreviewed candidate or an overdue check, the answering layer attaches its existing caution surface — converting silent staleness into disclosed staleness even before a human reviews.

## Increments

1. **Discovery dry-run (✅ done 2026-10-26).** Watchlist + discovery + `sync-corpus.ts` reporting. This increment alone kills the "never noticed" failure class. Supporting fixes shipped with it: ingestion caps raised (20 MB / 80 pages → 64 MB / 400) with silent truncation replaced by a loud failure — the old caps would have truncated the 103-page NLM guidelines at page 80 and rejected the 29 MB JJM 2.0 file outright.
2. **Auto-ingest known-URL changes + archive ladder.** Changed bytes at known URLs → staged ingest with text-hash comparison; fetch ladder direct → Wayback snapshot → Common Crawl → mark blocked (pmkisan.gov.in blocks datacenter fetches; this is already the lived reality, handled today by the manual `data/source-cache/manifest.json` ritual this increment retires).
3. **Generalised auto-linking.** The ladder above; lineage re-materialisation shared between `seed-local.ts` and the sync script. *(Partially pulled forward on 2026-10-26: the existing pair linker was rebuilt to sentence-level, target-anchored evidence after the backfill exposed whole-chunk false positives — see the findings section. The target-resolution ladder itself is still increment 3.)*
4. **Scheduling + freshness.** GitHub Actions weekly run; `sourceWatchStates` table + heartbeat; answer-layer stale caution; review-issue automation.
5. **LLM residue pass + OCR branch.** LLM-proposed edges behind the verbatim gate; OCR for scanned PDFs with chunks flagged OCR-derived (human-gated by policy).

## Open decisions for the owner

1. **JJM 2.0 OCR.** The 200-page mission-wide OG is downloaded and held (see `data/source-cache/manifest.json → heldDocuments`): fully scanned, no text layer. OCR it (flagged provenance) or wait for a text version? It is also a new document family, not part of the KRC chain.
2. **NLM Dec 2022 amendment.** Largely moot since 2026-10-26: the January 2025 comprehensive guidelines were retrieved from dahd.gov.in itself (no domain exception needed) and likely subsume the amendment. Confirm closure, or keep the udyamimitra exception question open for the amendment alone.
3. **Destructive-edge gate.** The policy above gates SUPERSEDES/REVOKES/REPLACES behind human review. Confirm, or set a confidence threshold for auto-promotion.
4. **CI secrets.** Increment 4 needs `DATABASE_URL`, storage, and LLM/embedding keys as GitHub Actions secrets.

## What the first live run actually found (2026-10-26)

The backfill ingestion (PM-KISAN Revised OG 2020 → doc 30001, 31 chunks; NLM Comprehensive Guidelines Jan 2025 → doc 30002, 222 chunks; corpus 329 → 582 chunks, all embedded) ran the existing pipeline against long comprehensive documents for the first time, and it caught three real defects — each a variation of the project's core failure mode:

1. **Whole-chunk first-match linking manufactures edges.** Scanning all chunks of the 103-page NLM guidelines for the first keyword match produced a VERIFIED `EXTENDS` edge from a livestock-insurance sentence ("sub-mission on innovation and extension of NLM"), and after that rule was tightened, a VERIFIED `REFERENCES` edge from bank-guarantee boilerplate. Fix: detection now runs per **sentence**, the sentence must **anchor** to a document (mentions the guidelines or cites the target's document number), and the stored evidence is the sentence itself (`linking.ts`, with regression tests for both collisions). The `EXTENDS`/`CONTINUES` rules were also anchored to document/period objects.
2. **A hard retrieval cap silently hid documents.** `answerPolicyQuestion` loaded at most 240 chunk rows; past that, chunks simply did not exist for the answerer — after the backfill, both new documents were fully invisible to unscoped questions while the lineage UI showed them. Fix: cap raised to 10,000 with the failure mode documented in code. Ranking is in-memory; the cap is a safety valve, not a sampling strategy.
3. **Honest end state for both pairs is "unresolved", and the corpus now says so.** Neither new document contains sentence-level evidence stating its relationship to its predecessor (the PM-KISAN cover states only a revision date; the NLM text's "revised and realigned" sentence describes the 2021 realignment). Final linker outcomes: PM-KISAN revision → original `REFERENCES/REJECTED` (pair checked, no evidence); NLM 2025 → 2021 `REFERENCES/AMBIGUOUS` (anchored revision language, not classifiable) — which flips the 2021 NLM guidelines to `AMBIGUOUS`, so NLM answers now carry a caution instead of confident staleness. For PM-KISAN, a human-review `AMBIGUOUS` assertion on the 2018 guidelines records the same unresolved-revision risk, with the revision cover page cited as its basis. Both pairs sit in the human gate exactly as the approval policy intends; `curatedChains.ts` records both new documents `NOT_ASSERTED`.
