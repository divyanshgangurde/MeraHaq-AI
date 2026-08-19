import { describe, expect, it } from "vitest";
import { validateCitation } from "./citationValidation";
import { validateEvidenceQuote } from "./evidenceValidation";
import {
  buildLineageGraph,
  determineLineageStatus,
  selectApplicableDocumentIds,
} from "./lineage";
import { detectDeterministicRelationship } from "./relationshipRules";
import { semanticOverlap } from "./retrieval";

describe("DHRUV AI deterministic relationship and evidence rules", () => {
  it("classifies explicit PM-KISAN amendment language without an LLM", () => {
    const detection = detectDeterministicRelationship(
      "Para 8.1 of the Operational Guidelines of PM-Kisan Scheme have further been amended and shall be read as follows."
    );

    expect(detection).toMatchObject({
      state: "MATCHED",
      relationshipType: "AMENDS",
      confidence: 0.97,
    });
  });

  it("rejects a relationship evidence quote that is absent from indexed source text", () => {
    const result = validateEvidenceQuote({
      sourceText: "The official document has no matching statement.",
      evidenceText: "This text was invented by a model.",
      pageStart: 1,
      pageEnd: 1,
    });

    expect(result).toEqual({
      valid: false,
      normalizedEvidence: "this text was invented by a model.",
      reason: "Evidence quote does not occur in the indexed source text",
    });
  });

  it("suppresses a verified superseded document from current-answer selection", () => {
    const statuses = determineLineageStatus(
      [
        {
          id: 1,
          schemeId: 1,
          title: "Historical guideline",
          sourceUrl: "https://example.gov.in/old",
          isOfficial: true,
        },
        {
          id: 2,
          schemeId: 1,
          title: "Current guideline",
          sourceUrl: "https://example.gov.in/new",
          isOfficial: true,
        },
      ],
      [
        {
          sourceDocumentId: 2,
          targetDocumentId: 1,
          relationshipType: "SUPERSEDES",
          verificationState: "VERIFIED",
          confidence: 0.99,
          evidenceText: "This guideline supersedes the prior guideline.",
        },
      ]
    );

    expect(selectApplicableDocumentIds([1, 2], statuses, "current")).toEqual([
      2,
    ]);
  });

  it("does not allow a citation without a source span that occurs in indexed content", () => {
    expect(
      validateCitation({
        documentId: 1,
        sourceUrl: "https://example.gov.in/document.pdf",
        pageStart: 1,
        pageEnd: 1,
        quote: "Unsupported citation",
        sourceText: "Official source content only.",
      })
    ).toEqual({
      valid: false,
      reason: "Evidence quote does not occur in the indexed source text",
    });
  });

  it("builds a lineage graph whose current status comes from relationships rather than publication dates", () => {
    const graph = buildLineageGraph(
      [
        {
          id: 1,
          schemeId: 1,
          title: "Newer historical notice",
          sourceUrl: "https://example.gov.in/a",
          issuedOn: new Date("2024-01-01"),
          isOfficial: true,
        },
        {
          id: 2,
          schemeId: 1,
          title: "Older effective guideline",
          sourceUrl: "https://example.gov.in/b",
          issuedOn: new Date("2020-01-01"),
          isOfficial: true,
        },
      ],
      [
        {
          sourceDocumentId: 2,
          targetDocumentId: 1,
          relationshipType: "SUPERSEDES",
          verificationState: "VERIFIED",
          confidence: 0.99,
          evidenceText: "supersedes",
        },
      ]
    );

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, status: "HISTORICAL" }),
        expect.objectContaining({ id: 2, status: "CURRENT_VERIFIED" }),
      ])
    );
    expect(graph.edges).toEqual([
      expect.objectContaining({
        relationshipType: "SUPERSEDES",
        sourceDocumentId: 2,
        targetDocumentId: 1,
      }),
    ]);
  });

  it("adds a semantic component when model-derived policy concepts overlap", () => {
    expect(
      semanticOverlap(
        ["aadhaar verification", "payment transfer"],
        ["payment transfer", "farmer eligibility"]
      )
    ).toBe(0.5);
  });
});
