import { and, eq } from "drizzle-orm";
import {
  documentChunks,
  documents,
  lineageAssertions,
  schemes,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import type { CitationCandidate, LineageStatus } from "./domain";
import { rankCandidates } from "./retrieval";
import { validateCitation } from "./citationValidation";
import { createSemanticProfile } from "./semantic";

type EvidenceSnippet = CitationCandidate & {
  evidenceId: number;
  title: string;
  lineageStatus: LineageStatus;
  isOfficial: boolean;
};

export type GroundedAnswer = {
  answer: string;
  verificationState: "VERIFIED" | "AMBIGUOUS" | "UNVERIFIED";
  caution: string | null;
  citations: Array<{
    title: string;
    sourceUrl: string;
    pageStart: number;
    pageEnd: number;
    quote: string;
    lineageStatus: LineageStatus;
  }>;
};

function abstain(reason: string): GroundedAnswer {
  return {
    answer:
      "I cannot verify an answer from DHRUV AI’s indexed official-source corpus yet.",
    verificationState: "UNVERIFIED",
    caution: reason,
    citations: [],
  };
}

function readModelJson(content: unknown): {
  answer: string;
  citedEvidenceIds: number[];
  caution: string | null;
} | null {
  if (typeof content !== "string") return null;
  try {
    const parsed = JSON.parse(content) as {
      answer?: unknown;
      citedEvidenceIds?: unknown;
      caution?: unknown;
    };
    if (
      typeof parsed.answer !== "string" ||
      !Array.isArray(parsed.citedEvidenceIds) ||
      !parsed.citedEvidenceIds.every(id => typeof id === "number") ||
      (parsed.caution !== null && typeof parsed.caution !== "string")
    ) {
      return null;
    }
    return {
      answer: parsed.answer,
      citedEvidenceIds: parsed.citedEvidenceIds,
      caution: parsed.caution,
    };
  } catch {
    return null;
  }
}

export async function answerFromEvidence(
  question: string,
  snippets: EvidenceSnippet[]
): Promise<GroundedAnswer> {
  const validSnippets = snippets.filter(
    snippet => snippet.isOfficial && validateCitation(snippet).valid
  );
  if (validSnippets.length === 0) {
    return abstain(
      "No indexed official evidence with a validated source span matches this question."
    );
  }

  const evidenceBlock = validSnippets
    .map(snippet =>
      [
        `EVIDENCE_ID: ${snippet.evidenceId}`,
        `TITLE: ${snippet.title}`,
        `SOURCE: ${snippet.sourceUrl}`,
        `PAGES: ${snippet.pageStart}-${snippet.pageEnd}`,
        `LINEAGE_STATUS: ${snippet.lineageStatus}`,
        `TEXT: ${snippet.sourceText}`,
      ].join("\n")
    )
    .join("\n\n---\n\n");

  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content:
          "You are DHRUV AI, an evidence-first Indian policy research assistant. Answer only from the evidence packets provided. Never invent a fact, document relationship, page, source, or citation. If the evidence does not answer the question, say so in the answer and cite no evidence IDs. Do not claim a document is current unless its packet says CURRENT_VERIFIED. Cite evidence IDs only when the answer is supported by that packet.",
      },
      {
        role: "user",
        content: `QUESTION:\n${question}\n\nEVIDENCE PACKETS:\n${evidenceBlock}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "grounded_dhruv_answer",
        strict: true,
        schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            citedEvidenceIds: { type: "array", items: { type: "integer" } },
            caution: { type: ["string", "null"] },
          },
          required: ["answer", "citedEvidenceIds", "caution"],
          additionalProperties: false,
        },
      },
    },
  });

  const modelAnswer = readModelJson(response.choices[0]?.message.content);
  if (!modelAnswer)
    return abstain(
      "The answer generator did not return a valid structured response."
    );

  const byEvidenceId = new Map(
    validSnippets.map(snippet => [snippet.evidenceId, snippet])
  );
  const citedSnippets = Array.from(new Set(modelAnswer.citedEvidenceIds))
    .map(id => byEvidenceId.get(id))
    .filter((snippet): snippet is EvidenceSnippet => Boolean(snippet));
  if (citedSnippets.length === 0) {
    return {
      answer: modelAnswer.answer,
      verificationState: "UNVERIFIED",
      caution:
        modelAnswer.caution ??
        "No validated evidence packet was cited for this answer.",
      citations: [],
    };
  }

  const hasAmbiguity = citedSnippets.some(
    snippet => snippet.lineageStatus !== "CURRENT_VERIFIED"
  );
  return {
    answer: modelAnswer.answer,
    verificationState: hasAmbiguity ? "AMBIGUOUS" : "VERIFIED",
    caution: hasAmbiguity
      ? (modelAnswer.caution ??
        "The cited evidence does not establish a fully verified current-applicability status.")
      : modelAnswer.caution,
    citations: citedSnippets.map(snippet => ({
      title: snippet.title,
      sourceUrl: snippet.sourceUrl,
      pageStart: snippet.pageStart,
      pageEnd: snippet.pageEnd,
      quote: snippet.quote,
      lineageStatus: snippet.lineageStatus,
    })),
  };
}

export async function answerPolicyQuestion(input: {
  question: string;
  schemeSlug?: string;
}): Promise<GroundedAnswer> {
  const db = await getDb();
  if (!db) return abstain("The policy corpus database is unavailable.");

  const rows = await db
    .select({
      chunkId: documentChunks.id,
      documentId: documents.id,
      content: documentChunks.content,
      embeddingJson: documentChunks.embeddingJson,
      pageStart: documentChunks.pageStart,
      pageEnd: documentChunks.pageEnd,
      title: documents.title,
      sourceUrl: documents.sourceUrl,
      isOfficial: documents.isOfficial,
      assertionStatus: lineageAssertions.status,
      schemeSlug: schemes.slug,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .innerJoin(schemes, eq(documents.schemeId, schemes.id))
    .leftJoin(lineageAssertions, eq(lineageAssertions.documentId, documents.id))
    .where(
      input.schemeSlug
        ? and(
            eq(schemes.slug, input.schemeSlug),
            eq(documents.processingState, "indexed")
          )
        : eq(documents.processingState, "indexed")
    )
    .limit(240);

  const queryProfile = await createSemanticProfile(input.question);
  const candidates = rows.map(row => ({
    documentId: row.documentId,
    content: row.content,
    embedding: null,
    semanticTerms:
      typeof row.embeddingJson === "object" &&
      row.embeddingJson !== null &&
      Array.isArray((row.embeddingJson as { terms?: unknown }).terms)
        ? (row.embeddingJson as { terms: unknown[] }).terms.filter(
            (term): term is string => typeof term === "string"
          )
        : [],
    lineageStatus: (row.assertionStatus ?? "UNVERIFIED") as LineageStatus,
    official: row.isOfficial,
  }));
  const ranked = rankCandidates(
    input.question,
    null,
    candidates,
    queryProfile.terms
  ).slice(0, 6);
  const byChunkId = new Map(rows.map(row => [row.chunkId, row]));
  const snippets: EvidenceSnippet[] = ranked.flatMap(candidate => {
    const row = rows.find(
      item =>
        item.documentId === candidate.documentId &&
        item.content === candidate.content
    );
    if (!row || !byChunkId.has(row.chunkId)) return [];
    return [
      {
        evidenceId: row.chunkId,
        documentId: row.documentId,
        sourceUrl: row.sourceUrl,
        pageStart: row.pageStart,
        pageEnd: row.pageEnd,
        quote: row.content.slice(0, 500),
        sourceText: row.content,
        title: row.title,
        lineageStatus: candidate.lineageStatus,
        isOfficial: row.isOfficial,
      },
    ];
  });

  return answerFromEvidence(input.question, snippets);
}
