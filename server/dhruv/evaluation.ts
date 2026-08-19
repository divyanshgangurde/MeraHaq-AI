import type { LineageStatus, RelationshipType } from "./domain";

export type EvaluationExpectation = {
  expectedDocumentIds: number[];
  expectedRelationshipTypes: RelationshipType[];
  expectedCitationDocumentIds: number[];
  expectedVerificationState: "VERIFIED" | "AMBIGUOUS" | "UNVERIFIED";
};

export type EvaluationObservation = {
  retrievedDocumentIds: number[];
  selectedDocumentIds: number[];
  citedDocumentIds: number[];
  detectedRelationshipTypes: RelationshipType[];
  verificationState: "VERIFIED" | "AMBIGUOUS" | "UNVERIFIED";
  documentStatuses: Record<number, LineageStatus>;
};

export type EvaluationMetrics = {
  retrievalRecall: number;
  citationRecall: number;
  relationshipRecall: number;
  outdatedSelectionRate: number;
  abstentionCorrect: boolean;
};

function recall<T extends string | number>(expected: T[], actual: T[]): number {
  if (expected.length === 0) return 1;
  const actualSet = new Set(actual);
  return (
    expected.filter(value => actualSet.has(value)).length / expected.length
  );
}

export function evaluateObservation(
  expectation: EvaluationExpectation,
  observation: EvaluationObservation
): EvaluationMetrics {
  const historicalSelections = observation.selectedDocumentIds.filter(
    id => observation.documentStatuses[id] === "HISTORICAL"
  ).length;
  const expectedAbstention =
    expectation.expectedVerificationState !== "VERIFIED";
  const actualAbstention = observation.verificationState !== "VERIFIED";

  return {
    retrievalRecall: recall(
      expectation.expectedDocumentIds,
      observation.retrievedDocumentIds
    ),
    citationRecall: recall(
      expectation.expectedCitationDocumentIds,
      observation.citedDocumentIds
    ),
    relationshipRecall: recall(
      expectation.expectedRelationshipTypes,
      observation.detectedRelationshipTypes
    ),
    outdatedSelectionRate:
      observation.selectedDocumentIds.length === 0
        ? 0
        : historicalSelections / observation.selectedDocumentIds.length,
    abstentionCorrect: expectedAbstention === actualAbstention,
  };
}

export function compareBaselineAndDhruv(
  expectation: EvaluationExpectation,
  baseline: EvaluationObservation,
  dhruv: EvaluationObservation
) {
  const baselineMetrics = evaluateObservation(expectation, baseline);
  const dhruvMetrics = evaluateObservation(expectation, dhruv);
  return {
    baseline: baselineMetrics,
    dhruv: dhruvMetrics,
    improvement: {
      retrievalRecall:
        dhruvMetrics.retrievalRecall - baselineMetrics.retrievalRecall,
      citationRecall:
        dhruvMetrics.citationRecall - baselineMetrics.citationRecall,
      relationshipRecall:
        dhruvMetrics.relationshipRecall - baselineMetrics.relationshipRecall,
      outdatedSelectionRate:
        baselineMetrics.outdatedSelectionRate -
        dhruvMetrics.outdatedSelectionRate,
    },
  };
}
