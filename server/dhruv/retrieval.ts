import type { LineageStatus } from "./domain";
import { normalizeText } from "./normalization";

export type RetrievalCandidate = {
  documentId: number;
  content: string;
  embedding?: number[] | null;
  semanticTerms?: string[];
  lineageStatus: LineageStatus;
  official: boolean;
};

export type RankedCandidate = RetrievalCandidate & {
  lexicalScore: number;
  semanticScore: number;
  finalScore: number;
};

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter(token => token.length > 2);
}

export function cosineSimilarity(
  left: number[] | null | undefined,
  right: number[] | null | undefined
): number {
  if (!left || !right || left.length === 0 || left.length !== right.length)
    return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export function lexicalScore(query: string, content: string): number {
  const terms = tokenize(query);
  if (terms.length === 0) return 0;
  const contentTokens = tokenize(content);
  if (contentTokens.length === 0) return 0;
  const frequency = new Map<string, number>();
  for (const token of contentTokens)
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  const total = terms.reduce(
    (sum, term) => sum + Math.min(frequency.get(term) ?? 0, 3),
    0
  );
  return total / (terms.length * 3);
}

function lineageAdjustment(status: LineageStatus, official: boolean): number {
  if (status === "HISTORICAL") return -1;
  if (status === "CURRENT_VERIFIED") return official ? 0.3 : 0.1;
  if (status === "AMBIGUOUS") return -0.1;
  return official ? 0.05 : -0.05;
}

export function rankCandidates(
  query: string,
  queryEmbedding: number[] | null,
  candidates: RetrievalCandidate[],
  querySemanticTerms: string[] = []
): RankedCandidate[] {
  return candidates
    .map(candidate => {
      const candidateLexicalScore = lexicalScore(query, candidate.content);
      const candidateSemanticScore = Math.max(
        semanticOverlap(querySemanticTerms, candidate.semanticTerms ?? []),
        0,
        cosineSimilarity(queryEmbedding, candidate.embedding)
      );
      return {
        ...candidate,
        lexicalScore: candidateLexicalScore,
        semanticScore: candidateSemanticScore,
        finalScore:
          0.55 * candidateLexicalScore +
          0.45 * candidateSemanticScore +
          lineageAdjustment(candidate.lineageStatus, candidate.official),
      };
    })
    .filter(candidate => candidate.lineageStatus !== "HISTORICAL")
    .sort((left, right) => right.finalScore - left.finalScore);
}

export function semanticOverlap(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) return 0;
  const leftSet = new Set(left.map(normalizeText));
  const rightSet = new Set(right.map(normalizeText));
  let shared = 0;
  leftSet.forEach(term => {
    if (rightSet.has(term)) shared += 1;
  });
  return shared / Math.max(leftSet.size, rightSet.size);
}
