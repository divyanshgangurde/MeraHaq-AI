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
  }>;
};

export const curatedChains: CuratedChain[] = [
  {
    schemeSlug: "jal-jeevan-mission",
    schemeName: "Jal Jeevan Mission — Key Resource Centres",
    status: "VERIFIED_SOURCE_CHAIN",
    sourceArchiveUrl: "https://jaljeevanmission.gov.in/guidelines",
    notes:
      "The 2020 KRC guideline and a 2023-amended official version are indexed. The verified AMENDS edge is backed by an indexed title-page source span.",
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
      "The original operational guidelines and paragraph 8.1 amendment are indexed. The AMENDS edge is supported by the indexed phrase ‘have further been amended and shall be read as follows.’",
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
    ],
  },
  {
    schemeSlug: "national-livestock-mission",
    schemeName: "National Livestock Mission operational-guideline lineage",
    status: "VERIFIED_SOURCE_CHAIN",
    sourceArchiveUrl: "https://dahd.gov.in/en/node/345",
    notes:
      "The July 2021 operational guidelines and the 28 December 2022 amendment order are indexed. The amendment’s explicit subject and reference to the 2021 guidelines support the verified AMENDS edge.",
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
