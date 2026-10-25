import { createHash } from "node:crypto";

/**
 * Discovery primitives for the corpus sync (CORPUS_SYNC.md, increment 1).
 *
 * Everything here is read-only: fetching a listing page and diffing its
 * PDF link set against the watchlist's known URLs. No function in this
 * module writes to the database or ingests anything. The point of the
 * dry-run layer is narrower and, on the evidence of October 2026, the
 * most important one: the corpus may still go stale, but never
 * *silently* stale — a new governing document shows up in a report
 * within one polling cycle of appearing on an official listing.
 */

const FETCH_TIMEOUT_MS = 30_000;
const USER_AGENT = "DHRUV-AI official-source verifier/1.0";

/** Hosts whose PDFs may ever be ingested (mirrors assertOfficialPdfUrl). */
function isOfficialHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host.endsWith(".gov.in") || host.endsWith(".nic.in");
}

/**
 * Extract absolute PDF links from a listing page's HTML. Only official
 * hosts are returned — a listing page linking to an aggregator mirror
 * is noted by its absence, never followed into the corpus.
 */
export function extractPdfLinks(html: string, baseUrl: string): string[] {
  const found = new Set<string>();
  const hrefPattern = /href\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefPattern.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    let resolved: URL;
    try {
      resolved = new URL(raw, baseUrl);
    } catch {
      continue;
    }
    if (resolved.protocol !== "https:") continue;
    if (!resolved.pathname.toLowerCase().endsWith(".pdf")) continue;
    if (!isOfficialHost(resolved.hostname)) continue;
    found.add(resolved.toString());
  }
  return Array.from(found).sort();
}

/** Order-independent fingerprint of a link set (sorted SHA-256). */
export function fingerprintLinkSet(links: string[]): string {
  const canonical = Array.from(new Set(links)).sort().join("\n");
  return createHash("sha256").update(canonical).digest("hex");
}

export type LinkSetDiff = {
  /** On the listing, not in the known set: candidates nobody tracks yet. */
  added: string[];
  /** Known, but not seen on this listing. Informational only — listings
   * are partial views, so absence is not evidence of removal. */
  notSeen: string[];
  seenCount: number;
};

export function diffLinkSets(
  knownUrls: string[],
  discoveredUrls: string[]
): LinkSetDiff {
  const known = new Set(knownUrls);
  const discovered = new Set(discoveredUrls);
  return {
    added: Array.from(discovered).filter(url => !known.has(url)).sort(),
    notSeen: Array.from(known).filter(url => !discovered.has(url)).sort(),
    seenCount: Array.from(known).filter(url => discovered.has(url)).length,
  };
}

export type ListingCheck =
  | {
      ok: true;
      url: string;
      status: number;
      links: string[];
      fingerprint: string;
    }
  | { ok: false; url: string; reason: string };

/** Fetch one listing page and fingerprint its official PDF link set. */
export async function checkListing(url: string): Promise<ListingCheck> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: { "user-agent": USER_AGENT, accept: "text/html,*/*" },
    });
    if (!response.ok) {
      return { ok: false, url, reason: `HTTP ${response.status}` };
    }
    const html = await response.text();
    const links = extractPdfLinks(html, url);
    return {
      ok: true,
      url,
      status: response.status,
      links,
      fingerprint: fingerprintLinkSet(links),
    };
  } catch (error) {
    return {
      ok: false,
      url,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export type WaybackSnapshot = {
  timestamp: string;
  digest: string | null;
  snapshotUrl: string;
} | null;

/**
 * Latest Wayback capture of an exact URL, via the CDX API. The capture
 * digest doubles as a change fingerprint: if the digest for a known
 * document URL changes between runs, the bytes at the official URL
 * changed — detectable without downloading the PDF. Fails soft (null)
 * because the archive is a fallback, never a dependency.
 */
export async function latestWaybackSnapshot(
  url: string
): Promise<WaybackSnapshot> {
  try {
    const cdx =
      `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}` +
      `&output=json&fl=timestamp,digest,statuscode&filter=statuscode:200&limit=5000`;
    const response = await fetch(cdx, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "user-agent": USER_AGENT },
    });
    if (!response.ok) return null;
    const rows = (await response.json()) as string[][];
    // CDX returns captures in chronological order; the last row is the
    // most recent successful capture of this exact URL.
    const data = rows.slice(1);
    if (data.length === 0) return null;
    const [timestamp, digest] = data[data.length - 1];
    return {
      timestamp,
      digest: digest ?? null,
      snapshotUrl: `https://web.archive.org/web/${timestamp}id_/${url}`,
    };
  } catch {
    return null;
  }
}
