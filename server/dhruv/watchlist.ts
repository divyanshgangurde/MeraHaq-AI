/**
 * Watchlist manifest for the self-updating corpus (CORPUS_SYNC.md,
 * increment 1: discovery + dry-run reporting, no writes).
 *
 * curatedChains.ts is the *verified registry* — documents that have
 * been ingested and evidence-checked. This file is the *discovery
 * config*: where to look for documents nobody has ingested yet, and
 * which document URLs are already known so a listing diff can tell
 * "new" from "already tracked".
 *
 * A discovered document graduates from watchlist candidate to the
 * verified registry only by being ingested and linked — never by
 * editing this file to assert a relationship by hand.
 */
export type SourceWatch = {
  schemeSlug: string;
  /** Pages that list the scheme's official documents (polled, no API exists). */
  listingUrls: string[];
  /** Document URLs already tracked in curatedChains.ts for this scheme. */
  knownDocumentUrls: string[];
  /** Tripwire pages (press releases, notices) that announce change early. */
  signalUrls: string[];
  /** Polling cadence. Weekly is deliberate politeness: these schemes
   * publish a handful of documents a year. */
  cadenceDays: number;
  fetchPreference: "direct-first";
};

export const corpusWatchlist: SourceWatch[] = [
  {
    schemeSlug: "jal-jeevan-mission",
    listingUrls: ["https://jaljeevanmission.gov.in/guidelines"],
    knownDocumentUrls: [
      "https://jaljeevanmission.gov.in/sites/default/files/manual_document/revised_krc_guidelines.pdf",
      "https://jaljeevanmission.gov.in/sites/default/files/guideline/Amendment-in-guidelines-for-capacity-building-by-KRCs.pdf",
      // JJM 2.0 mission-wide OG: discovered, downloaded, HELD — the PDF
      // is fully scanned (no extractable text) and it is a different
      // document family from the KRC chain. Tracked here so the watcher
      // keeps reporting it as known-held instead of re-alerting weekly.
      "https://jaljeevanmission.gov.in/sites/default/files/guideline/Operational-Guidelines-JJM-2.pdf",
    ],
    signalUrls: ["https://www.pib.gov.in/allrelease.aspx?lang=1&reg=3"],
    cadenceDays: 7,
    fetchPreference: "direct-first",
  },
  {
    schemeSlug: "pm-kisan",
    listingUrls: ["https://pmkisan.gov.in/"],
    knownDocumentUrls: [
      "https://pmkisan.gov.in/Documents/OPERATIONAL%20GUIDELINES.pdf",
      "https://pmkisan.gov.in/Documents/Amendment%20to%20OG-converted.pdf",
      "https://pmkisan.gov.in/Documents/RevisedPM-KISANOperationalGuidelines(English).pdf",
    ],
    signalUrls: ["https://www.pib.gov.in/allrelease.aspx?lang=1&reg=3"],
    cadenceDays: 7,
    fetchPreference: "direct-first",
  },
  {
    schemeSlug: "national-livestock-mission",
    listingUrls: ["https://dahd.gov.in/en/node/345"],
    knownDocumentUrls: [
      "https://dahd.gov.in/sites/default/files/2023-11/NLMGuidelinesFinalApprovedByEC.pdf",
      "https://dahd.gov.in/sites/default/files/2023-07/AmendmentintheOperationalGuidelinesofNLMreg.pdf",
      "https://www.dahd.gov.in/static/uploads/2026/04/646d8392917491a43e1ce4686613d661.pdf",
    ],
    signalUrls: ["https://www.pib.gov.in/allrelease.aspx?lang=1&reg=3"],
    cadenceDays: 7,
    fetchPreference: "direct-first",
  },
  {
    schemeSlug: "pmfby",
    listingUrls: ["https://pmfby.gov.in/guidelines"],
    knownDocumentUrls: [
      "https://pmfby.amnex.co.in/pmfby/pdf/operational_guidelines_pmfby.pdf",
    ],
    signalUrls: ["https://www.pib.gov.in/allrelease.aspx?lang=1&reg=3"],
    cadenceDays: 7,
    fetchPreference: "direct-first",
  },
];
