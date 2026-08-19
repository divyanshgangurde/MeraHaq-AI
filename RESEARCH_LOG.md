# DHRUV AI — Verified Source Research Log

## Candidate first vertical slice: PM-KISAN operational-guideline lineage

The official PM-KISAN portal identifies itself as the Department of Agriculture and Farmers Welfare, Ministry of Agriculture and Farmers Welfare, Government of India. Its guideline archive links the pre-revised operational guidelines, an amendment in the operational guidelines, and multiple clarifications.[1]

| Candidate document                   | Official URL                                                                       | Verified document text                                                                                                                                                                                                    | Proposed handling                                                                                                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original operational guidelines      | https://pmkisan.gov.in/Documents/OPERATIONAL%20GUIDELINES.pdf                      | The document is titled “Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) Operational Guidelines”; its original benefit rule applies to small and marginal landholder farmer families with cultivable land up to two hectares. | Seed as the historical base document after download, hash, and page-aware extraction.                                                                      |
| Amendment to paragraph 8.1           | https://pmkisan.gov.in/Documents/Amendment%20to%20OG-converted.pdf                 | The document is titled “Amendment to Para 8.1 of Operational Guidelines of PM-KISAN Scheme (as on 11.03.2019)” and explicitly states that paragraph 8.1 “have further been amended and shall be read as follows.”         | Strong deterministic `AMENDS` candidate against the base guidelines, supported by the quoted language.                                                     |
| Clarification on joint holding       | https://pmkisan.gov.in/Documents/clarification_on_OGs_of_PMKISAN.PDF               | The document is titled “Clarification on interpretation of the words ‘Joint Holding’ in para 3.2 of Operational Guidelines of PM-KISAN.”                                                                                  | Strong deterministic `REFERENCES` candidate to the base document. Do not upgrade to `AMENDS` unless later review supplies direct amendment language.       |
| Clarification on clauses 3.3 and 3.4 | https://pmkisan.gov.in/Documents/ClarificationsrelatingtoClauses.PDF               | The document explicitly states that it clarifies clauses 3.3 and 3.4 of the operational guidelines, including treatment of ownership succession and the 01.02.2019 cut-off date.                                          | Additional `REFERENCES` candidate; useful for a follow-up extension of the vertical slice.                                                                 |
| Revised operating guidelines         | https://pmkisan.gov.in/Documents/RevisedPM-KISANOperationalGuidelines(English).pdf | The title states “Operational Guidelines (Revised as on 29.03.2020).” It contains the revised eligibility and payment sections, including a broader landholder-family formulation and updated paragraph numbering.        | Treat as a potentially current consolidated source. Do not persist a `REPLACES` or `SUPERSEDES` edge until an evidence-backed relationship is established. |

## First evidence-backed question

The first gold case should use a question about the payment or identity-verification operation governed by paragraph 8.1 / revised paragraph 10.2. The baseline path can retrieve the historical original guidelines, while DHRUV AI must show the explicit amendment and avoid calling the historical wording current. The exact answer is deliberately deferred until all relevant source documents are downloaded, hashed, text-extracted, and source-span validated.

## Next verification gates

1. Download the selected PDFs from their official URLs and calculate document hashes.
2. Confirm page numbers and preserve the exact amendment sentence in page-aware text.
3. Persist only the deterministic `AMENDS` edge between the explicit amendment and the base document during the first slice.
4. Persist clarifications as `REFERENCES` until a reviewed relationship type is supported by exact language.
5. Do not state that the 2020 revision supersedes or replaces earlier documents without direct supporting evidence.

## Live-ingestion validation — Jal Jeevan Mission

On 19 August 2026, the official Jal Jeevan Mission amendment titled **“Amendment in guidelines for Capacity Building by Key Resource Centre (KRCs)”** was retrieved from the official JJM government host through the DHRUV AI ingestion pipeline. The system stored the original PDF and extracted-text artifact in object storage, calculated SHA-256 `6196f45499ba2e06914bd0efe918b514a70dd0cf7a5bf8c6a17d8c98b62201ee`, extracted 44 text-bearing pages into 85 chunks, and retained the official source URL. Extracted reference evidence remained **unresolved** because no source-verified base guideline was linked; no unsupported lineage relationship was created.

The October 2020 official **“Guidelines for Capacity Building by Key Resource Centres”** was subsequently ingested as a separately hashed base document. A deterministic post-ingestion link review was attempted. Because the indexed amendment text did not yield an explicit, source-span-validated relationship sentence under the permitted rule set, DHRUV AI persisted the candidate as `REFERENCES` with internal state `REJECTED` rather than claiming an `AMENDS` relationship. This preserves the evidence trail while requiring a reviewer to locate a qualifying explicit passage before changing the graph.

## PM-KISAN connectivity note

The PM-KISAN candidate URLs above were verified through official-source text extraction, but direct server-side retrieval from `pmkisan.gov.in` timed out from the current sandbox during the initial import attempt. The candidate chain remains documented for later ingestion rather than being replaced with synthetic documents or unsupported relationship assertions.

## Completed PM-KISAN source lineage

The official PM-KISAN base guideline and paragraph 8.1 amendment were subsequently imported through the guarded ingestion path after adding a transparent, bounded source-verifier user agent. Both PDFs were stored as content-addressed artifacts, text was extracted page by page, and the amendment was linked to the base guideline with a `VERIFIED` `AMENDS` edge. The evidence spans include the indexed amendment wording: **“Para 8.1 of the Operational Guidelines of PM-Kisan Scheme have further been amended and shall be read as follows.”** The former connectivity note is retained above as an audit record of the initial failed approach.

## Completed National Livestock Mission source lineage

The official July 2021 National Livestock Mission operational guidelines and the Department of Animal Husbandry and Dairying order dated 28 December 2022 were ingested from `dahd.gov.in`. The amendment order explicitly identifies itself as **“Amendment in the operational Guidelines of National Livestock Mission (NLM)”** and refers to the July 2021 guideline. DHRUV AI therefore persisted a `VERIFIED` `AMENDS` edge with page-aware source evidence rather than inferring status from the document dates alone.

## Updated Jal Jeevan Mission source lineage

The original temporary JJM link rejection was re-evaluated after a narrower deterministic rule was added for the indexed phrase **“October, 2020 (amended in November, 2023)”**. With the reviewer-selected 2020 base document, this exact source span validated a `VERIFIED` `AMENDS` relationship. The superseded rejection remains part of the audit trail; the current graph uses the evidence-validated relationship.

## References

[1]: https://pmkisan.gov.in/ "PM-KISAN — Department of Agriculture and Farmers Welfare, Ministry of Agriculture and Farmers Welfare, Government of India"
