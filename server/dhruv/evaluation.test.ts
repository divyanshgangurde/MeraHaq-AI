import { describe, expect, it } from "vitest";
import { compareBaselineAndDhruv } from "./evaluation";

describe("DHRUV AI evaluation engine", () => {
  it("quantifies the benefit of avoiding a verified historical document", () => {
    const result = compareBaselineAndDhruv(
      {
        expectedDocumentIds: [2],
        expectedRelationshipTypes: ["SUPERSEDES"],
        expectedCitationDocumentIds: [2],
        expectedVerificationState: "VERIFIED",
      },
      {
        retrievedDocumentIds: [1, 2],
        selectedDocumentIds: [1],
        citedDocumentIds: [1],
        detectedRelationshipTypes: [],
        verificationState: "VERIFIED",
        documentStatuses: { 1: "HISTORICAL", 2: "CURRENT_VERIFIED" },
      },
      {
        retrievedDocumentIds: [1, 2],
        selectedDocumentIds: [2],
        citedDocumentIds: [2],
        detectedRelationshipTypes: ["SUPERSEDES"],
        verificationState: "VERIFIED",
        documentStatuses: { 1: "HISTORICAL", 2: "CURRENT_VERIFIED" },
      }
    );

    expect(result.baseline.outdatedSelectionRate).toBe(1);
    expect(result.dhruv.outdatedSelectionRate).toBe(0);
    expect(result.improvement.outdatedSelectionRate).toBe(1);
    expect(result.improvement.relationshipRecall).toBe(1);
  });
});
