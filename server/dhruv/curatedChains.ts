export type CuratedChain = {
  schemeSlug: string;
  schemeName: string;
  status: "VERIFIED_SOURCE_CHAIN" | "SOURCE_CANDIDATES_ONLY";
  sourceArchiveUrl: string;
  notes: string;
  documents: Array<{
    title: string;
    sourceUrl: string;
    documentStatus: "VERIFIED_INDEXED" | "CANDIDATE_NOT_INGESTED";
    relationshipStatus: "VERIFIED" | "NOT_ASSERTED";
    /**
     * Optional explicit document type. When omitted, the seed falls back
     * to its legacy position-based default (first document = guideline,
     * the rest = amendment), which is wrong for consolidated revisions —
     * a comprehensive re-issue is a guideline, not an amendment.
     */
    documentType?:
      | "guideline"
      | "amendment"
      | "clarification"
      | "corrigendum"
      | "notification"
      | "order"
      | "other";
    /**
     * Optional ISO issue date (YYYY-MM-DD) used when PDF metadata does
     * not yield a reliable date. Month-precision dates use the 1st and
     * say so in the chain notes.
     */
    issuedOn?: string;
  }>;
};

export const curatedChains: CuratedChain[] = [
  {
    schemeSlug: "jal-jeevan-mission",
    schemeName: "Jal Jeevan Mission — Key Resource Centres",
    status: "VERIFIED_SOURCE_CHAIN",
    sourceArchiveUrl: "https://jaljeevanmission.gov.in/guidelines",
    notes:
      "The 2020 KRC guideline and a 2023-amended official version are indexed. The verified AMENDS edge is backed by an indexed title-page source span. Currency note 2026-10-26: the mission-wide JJM 2.0 Operational Guidelines (200 pp) were downloaded from the official listing but are NOT part of this chain — they are a different document family (mission-wide OG, not the KRC sub-guideline) and the PDF is fully scanned with no extractable text. The bytes are held in data/source-cache (see manifest.json heldDocuments) pending the owner's OCR decision.",
    documents: [
      {
        title: "Guidelines for Capacity Building by Key Resource Centres",
        sourceUrl:
          "https://jaljeevanmission.gov.in/sites/default/files/manual_document/revised_krc_guidelines.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "NOT_ASSERTED",
      },
      {
        title:
          "Amendment in guidelines for Capacity Building by Key Resource Centre (KRCs)",
        sourceUrl:
          "https://jaljeevanmission.gov.in/sites/default/files/guideline/Amendment-in-guidelines-for-capacity-building-by-KRCs.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "VERIFIED",
      },
    ],
  },
  {
    schemeSlug: "pm-kisan",
    schemeName: "PM-KISAN operational-guideline lineage",
    status: "VERIFIED_SOURCE_CHAIN",
    sourceArchiveUrl: "https://pmkisan.gov.in/",
    notes:
      "The original operational guidelines and paragraph 8.1 amendment are indexed. The AMENDS edge is supported by the indexed phrase ‘have further been amended and shall be read as follows.’ Link status 2026-10-25: both URLs are live (verified loading in a real browser), but pmkisan.gov.in drops direct fetches from some datacenter networks (empty reply), so the local seed retrieves authentic bytes via Internet Archive snapshots of these exact official URLs (see data/source-cache/manifest.json). Currency update 2026-10-26: the portal's consolidated revised operational guidelines (revised as on 29.03.2020) were added as a third document. The revision carries no explicit supersession language — its cover states only the revision date — so its lineage relationship is NOT_ASSERTED until the evidence linker or a human reviewer establishes it; a consolidated revision silently treated as unrelated (or silently treated as superseding) would both be wrong.",
    documents: [
      {
        title:
          "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) Operational Guidelines",
        sourceUrl:
          "https://pmkisan.gov.in/Documents/OPERATIONAL%20GUIDELINES.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "NOT_ASSERTED",
      },
      {
        title:
          "Amendment to Para 8.1 of Operational Guidelines of PM-KISAN Scheme",
        sourceUrl:
          "https://pmkisan.gov.in/Documents/Amendment%20to%20OG-converted.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "VERIFIED",
      },
      {
        title:
          "PM-KISAN Operational Guidelines (Revised as on 29.03.2020)",
        sourceUrl:
          "https://pmkisan.gov.in/Documents/RevisedPM-KISANOperationalGuidelines(English).pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "NOT_ASSERTED",
        documentType: "guideline",
        issuedOn: "2020-03-29",
      },
    ],
  },
  {
    schemeSlug: "national-livestock-mission",
    schemeName: "National Livestock Mission operational-guideline lineage",
    status: "VERIFIED_SOURCE_CHAIN",
    sourceArchiveUrl: "https://dahd.gov.in/en/node/345",
    notes:
      "The July 2021 operational guidelines and the 28 December 2022 amendment order are indexed. The amendment’s explicit subject and reference to the 2021 guidelines support the verified AMENDS edge. Link status 2026-10-25: both dahd.gov.in URLs below now return 404 since the DAHD site rebuild. The guideline's bytes were recovered from an Internet Archive snapshot of the official URL (see data/source-cache/manifest.json). The amendment order (R-99014/45/2021-Anlm_Dadf, 28 Dec 2022) currently survives only on the official NLM portal, nlm.udyamimitra.in, which the gov.in/nic.in-only ingestion rule excludes, and the file is a scanned PDF; local re-ingestion of the amendment is pending a decision on that exception. Currency update 2026-10-26: the Comprehensive Operational Guidelines (January 2025, month precision — issuedOn recorded as 2025-01-01) were added as a third document, retrieved from dahd.gov.in itself, so no domain exception was needed for it. The comprehensive guidelines contain no explicit supersession sentence over the 2021 guidelines, so their relationship is NOT_ASSERTED pending linker evidence or human review; whether they subsume the Dec 2022 amendment is part of that same review.",
    documents: [
      {
        title: "Operational Guidelines for National Livestock Mission",
        sourceUrl:
          "https://dahd.gov.in/sites/default/files/2023-11/NLMGuidelinesFinalApprovedByEC.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "NOT_ASSERTED",
      },
      {
        title:
          "Amendment in the Operational Guidelines of National Livestock Mission (NLM)",
        sourceUrl:
          "https://dahd.gov.in/sites/default/files/2023-07/AmendmentintheOperationalGuidelinesofNLMreg.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "VERIFIED",
      },
      {
        title:
          "Comprehensive Operational Guidelines for National Livestock Mission (January 2025)",
        sourceUrl:
          "https://www.dahd.gov.in/static/uploads/2026/04/646d8392917491a43e1ce4686613d661.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "NOT_ASSERTED",
        documentType: "guideline",
        issuedOn: "2025-01-01",
      },
    ],
  },
  {
    schemeSlug: "pmfby",
    schemeName: "Pradhan Mantri Fasal Bima Yojana operational guidelines",
    status: "SOURCE_CANDIDATES_ONLY",
    sourceArchiveUrl: "https://pmfby.gov.in/guidelines",
    notes:
      "The official archive lists operational-guideline revisions. Documents remain unavailable to answers until byte hashing, extraction, and relationship review complete.",
    documents: [
      {
        title:
          "2023 Operational Guidelines of Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        sourceUrl:
          "https://pmfby.amnex.co.in/pmfby/pdf/operational_guidelines_pmfby.pdf",
        documentStatus: "CANDIDATE_NOT_INGESTED",
        relationshipStatus: "NOT_ASSERTED",
      },
    ],
  },
  {
    schemeSlug: "enam",
    schemeName: "National Agriculture Market (e-NAM)",
    status: "SOURCE_CANDIDATES_ONLY",
    sourceArchiveUrl:
      "https://agriwelfare.gov.in/sites/default/files/Revised_eNAM_guidelines_Oct2023.pdf",
    notes:
      "The official revised operational guideline is a candidate source only; it has no asserted predecessor or current-applicability result in DHRUV AI yet.",
    documents: [
      {
        title: "Revised e-NAM operational guidelines (October 2023)",
        sourceUrl:
          "https://agriwelfare.gov.in/sites/default/files/Revised_eNAM_guidelines_Oct2023.pdf",
        documentStatus: "CANDIDATE_NOT_INGESTED",
        relationshipStatus: "NOT_ASSERTED",
      },
    ],
  },
];
