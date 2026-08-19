import { createHash } from "node:crypto";
import { PDFParse } from "pdf-parse";
import { and, eq } from "drizzle-orm";
import {
  documentArtifacts,
  documentChunks,
  documentReferences,
  documentRelationships,
  documents,
  ingestionRuns,
  lineageAssertions,
  relationshipEvidence,
  schemes,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { validateEvidenceQuote } from "./evidenceValidation";
import {
  normalizeDateReference,
  normalizeDocumentNumber,
  normalizeText,
} from "./normalization";
import { detectDeterministicRelationship } from "./relationshipRules";
import { createSemanticProfile } from "./semantic";

const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
const MAX_PAGES = 80;
const FETCH_TIMEOUT_MS = 60_000;

type IngestionRequest = {
  schemeSlug: string;
  title: string;
  issuingAuthority: string;
  documentType:
    | "guideline"
    | "amendment"
    | "clarification"
    | "corrigendum"
    | "notification"
    | "order"
    | "other";
  sourceUrl: string;
  issuedOn?: Date;
  relatedDocumentId?: number;
};

type PageText = { page: number; text: string };
type ExtractedMetadata = {
  pdfTitle: string | null;
  creator: string | null;
  creationDate: string | null;
  documentNumber: string | null;
  issuedOn: Date | null;
  pageCount: number;
};

export function assertOfficialPdfUrl(sourceUrl: string): URL {
  const url = new URL(sourceUrl);
  const host = url.hostname.toLowerCase();
  const isOfficialDomain = host.endsWith(".gov.in") || host.endsWith(".nic.in");
  if (url.protocol !== "https:" || !isOfficialDomain) {
    throw new Error(
      "Only HTTPS documents hosted on official Indian government domains may be ingested"
    );
  }
  return url;
}

async function downloadPdf(sourceUrl: string): Promise<Buffer> {
  assertOfficialPdfUrl(sourceUrl);
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
  });
  if (!response.ok)
    throw new Error(`Official source returned HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_DOCUMENT_BYTES)
    throw new Error("Official source PDF exceeds the configured size limit");
  if (
    !contentType.includes("pdf") &&
    !sourceUrl.toLowerCase().includes(".pdf")
  ) {
    throw new Error("Official source did not identify itself as a PDF");
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_DOCUMENT_BYTES) {
    throw new Error(
      "Downloaded PDF is empty or exceeds the configured size limit"
    );
  }
  if (bytes.subarray(0, 4).toString() !== "%PDF")
    throw new Error("Downloaded file does not have a PDF signature");
  return bytes;
}

function parsePdfDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeDateReference(value);
  if (normalized) return new Date(`${normalized}T00:00:00.000Z`);
  const pdfDate = value.match(/^D:(\d{4})(\d{2})(\d{2})/);
  return pdfDate
    ? new Date(`${pdfDate[1]}-${pdfDate[2]}-${pdfDate[3]}T00:00:00.000Z`)
    : null;
}

export function extractDocumentMetadata(
  pages: PageText[],
  info: Record<string, unknown>,
  parsedCreationDate?: Date | null
): ExtractedMetadata {
  const frontMatter = pages
    .slice(0, 2)
    .map(page => page.text)
    .join("\n");
  const rawNumber = frontMatter.match(
    /(?:F\.?\s*No\.?|Order\s*No\.?|Notification\s*No\.?|No\.?)\s*([A-Za-z0-9/(). -]{3,80}?)(?=\s+(?:dated|date)\b|\n|$)/i
  )?.[1];
  const rawDate = frontMatter.match(
    /(?:dated|date)\s*[:.-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i
  )?.[1];
  const normalizedDate = normalizeDateReference(rawDate);
  return {
    pdfTitle: typeof info.Title === "string" ? info.Title.trim() || null : null,
    creator:
      typeof info.Creator === "string" ? info.Creator.trim() || null : null,
    creationDate:
      parsedCreationDate?.toISOString() ??
      (typeof info.CreationDate === "string" ? info.CreationDate : null),
    documentNumber: normalizeDocumentNumber(rawNumber),
    issuedOn: normalizedDate
      ? new Date(`${normalizedDate}T00:00:00.000Z`)
      : (parsedCreationDate ?? parsePdfDate(info.CreationDate)),
    pageCount: pages.length,
  };
}

async function extractPageAwareText(
  pdfBytes: Buffer
): Promise<{ pages: PageText[]; metadata: ExtractedMetadata }> {
  const parser = new PDFParse({ data: pdfBytes });
  try {
    const info = await parser.getInfo({ parsePageInfo: true });
    const pageCount = Math.min(info.total, MAX_PAGES);
    const pages: PageText[] = [];
    for (let page = 1; page <= pageCount; page += 1) {
      const result = await parser.getText({ partial: [page] });
      const text = result.text.trim();
      if (text) pages.push({ page, text });
    }
    if (pages.length === 0)
      throw new Error("No selectable text was extracted from the PDF");
    return {
      pages,
      metadata: extractDocumentMetadata(
        pages,
        (info.info ?? {}) as Record<string, unknown>,
        info.getDateNode().CreationDate
      ),
    };
  } finally {
    await parser.destroy();
  }
}

function createChunks(pages: PageText[], maxLength = 1_200, overlap = 180) {
  const chunks: Array<{
    content: string;
    pageStart: number;
    pageEnd: number;
    tokenCount: number;
    contentHash: string;
    lexicalTerms: string[];
  }> = [];
  for (const page of pages) {
    const text = page.text.replace(/\s+/g, " ").trim();
    for (let offset = 0; offset < text.length; offset += maxLength - overlap) {
      const content = text.slice(offset, offset + maxLength).trim();
      if (!content) continue;
      const lexicalTerms = Array.from(
        new Set(
          normalizeText(content)
            .split(/[^a-z0-9]+/)
            .filter(term => term.length > 2)
        )
      ).slice(0, 160);
      chunks.push({
        content,
        pageStart: page.page,
        pageEnd: page.page,
        tokenCount: content.split(/\s+/).filter(Boolean).length,
        contentHash: createHash("sha256").update(content).digest("hex"),
        lexicalTerms,
      });
      if (offset + maxLength >= text.length) break;
    }
  }
  return chunks;
}

function extractReferenceCandidates(pages: PageText[]) {
  return pages.flatMap(page =>
    page.text
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(sentence =>
        /\b(?:operational guidelines|amendment|clarification|corrigendum|supersedes|replaces|revokes|extends)\b/i.test(
          sentence
        )
      )
      .slice(0, 12)
      .map(evidenceText => ({
        evidenceText,
        pageStart: page.page,
        pageEnd: page.page,
        referencedNumber:
          evidenceText.match(/(?:No\.|Number)\s*([A-Za-z0-9/().-]+)/i)?.[1] ??
          null,
      }))
  );
}

export function referenceResolution(
  evidenceText: string,
  hasRelatedDocument: boolean
): "unresolved" | "matched" | "ambiguous" | "rejected" {
  if (!hasRelatedDocument) return "unresolved";
  const detection = detectDeterministicRelationship(evidenceText);
  if (detection.state === "MATCHED") return "matched";
  return detection.state === "REQUIRES_HUMAN_REVIEW" ? "ambiguous" : "rejected";
}

export function relationshipVerificationState(
  evidenceText: string,
  evidenceValid: boolean
): "VERIFIED" | "AMBIGUOUS" | "REJECTED" {
  const detection = detectDeterministicRelationship(evidenceText);
  if (detection.state === "MATCHED" && evidenceValid) return "VERIFIED";
  if (detection.state === "REQUIRES_HUMAN_REVIEW") return "AMBIGUOUS";
  return "REJECTED";
}

export async function ingestOfficialPdf(input: IngestionRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const url = assertOfficialPdfUrl(input.sourceUrl);

  const scheme = await db
    .select()
    .from(schemes)
    .where(eq(schemes.slug, input.schemeSlug))
    .limit(1);
  if (!scheme[0]) throw new Error(`Unknown scheme: ${input.schemeSlug}`);

  const runResult = await db.insert(ingestionRuns).values({
    sourceUrl: url.toString(),
    state: "processing",
    steps: [{ stage: "queued", at: new Date().toISOString() }],
  });
  const runId = Number(runResult[0].insertId);

  try {
    const pdfBytes = await downloadPdf(url.toString());
    const documentHash = createHash("sha256").update(pdfBytes).digest("hex");
    const existing = await db
      .select()
      .from(documents)
      .where(eq(documents.documentHash, documentHash))
      .limit(1);
    if (existing[0]) {
      await db
        .update(ingestionRuns)
        .set({
          state: "completed",
          documentId: existing[0].id,
          completedAt: new Date(),
          steps: [{ stage: "deduplicated", at: new Date().toISOString() }],
        })
        .where(eq(ingestionRuns.id, runId));
      return { document: existing[0], deduplicated: true };
    }

    const extracted = await extractPageAwareText(pdfBytes);
    const pageText = extracted.pages;
    const pdfObject = await storagePut(
      `dhruv-ai/documents/${scheme[0].slug}/${documentHash}.pdf`,
      pdfBytes,
      "application/pdf"
    );
    const textObject = await storagePut(
      `dhruv-ai/extracted-text/${scheme[0].slug}/${documentHash}.json`,
      JSON.stringify({ sourceUrl: url.toString(), pages: pageText }),
      "application/json"
    );
    const documentResult = await db.insert(documents).values({
      schemeId: scheme[0].id,
      title: input.title,
      issuingAuthority: input.issuingAuthority,
      documentType: input.documentType,
      documentNumber: extracted.metadata.documentNumber,
      issuedOn: input.issuedOn ?? extracted.metadata.issuedOn,
      sourceUrl: url.toString(),
      storageKey: pdfObject.key,
      extractedTextStorageKey: textObject.key,
      documentHash,
      pageCount: pageText.length,
      metadataJson: extracted.metadata,
      isOfficial: true,
      processingState: "indexed",
    });
    const documentId = Number(documentResult[0].insertId);
    const referenceCandidates = extractReferenceCandidates(pageText);
    if (referenceCandidates.length > 0) {
      await db.insert(documentReferences).values(
        referenceCandidates.map(reference => ({
          sourceDocumentId: documentId,
          candidateDocumentId: input.relatedDocumentId ?? null,
          referencedNumber: reference.referencedNumber,
          evidenceText: reference.evidenceText,
          pageStart: reference.pageStart,
          pageEnd: reference.pageEnd,
          resolutionState: referenceResolution(
            reference.evidenceText,
            Boolean(input.relatedDocumentId)
          ),
        }))
      );
    }

    if (input.relatedDocumentId) {
      const related = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.id, input.relatedDocumentId),
            eq(documents.schemeId, scheme[0].id)
          )
        )
        .limit(1);
      if (!related[0]) {
        throw new Error(
          "The related document must belong to the same supported scheme"
        );
      }
      const relationshipCandidate = referenceCandidates
        .map(reference => ({
          ...reference,
          detection: detectDeterministicRelationship(reference.evidenceText),
        }))
        .find(candidate => candidate.detection.state === "MATCHED");
      let persistedVerifiedRelationship = false;
      if (relationshipCandidate?.detection.state === "MATCHED") {
        const validation = validateEvidenceQuote({
          sourceText:
            pageText.find(page => page.page === relationshipCandidate.pageStart)
              ?.text ?? "",
          evidenceText: relationshipCandidate.evidenceText,
          pageStart: relationshipCandidate.pageStart,
          pageEnd: relationshipCandidate.pageEnd,
        });
        if (validation.valid) {
          const relationshipResult = await db
            .insert(documentRelationships)
            .values({
              sourceDocumentId: documentId,
              targetDocumentId: related[0].id,
              relationshipType:
                relationshipCandidate.detection.relationshipType,
              scope: relationshipCandidate.detection.scope,
              confidence: relationshipCandidate.detection.confidence,
              extractionMethod: "deterministic",
              verificationState: "VERIFIED",
            });
          await db.insert(relationshipEvidence).values({
            relationshipId: Number(relationshipResult[0].insertId),
            documentId,
            evidenceText: relationshipCandidate.evidenceText,
            normalizedEvidenceText: validation.normalizedEvidence,
            pageStart: relationshipCandidate.pageStart,
            pageEnd: relationshipCandidate.pageEnd,
          });
          persistedVerifiedRelationship = true;
        }
      }
      if (!persistedVerifiedRelationship) {
        const candidate = relationshipCandidate ?? referenceCandidates[0];
        const verificationState = relationshipVerificationState(
          candidate?.evidenceText ?? "",
          false
        );
        await db.insert(documentRelationships).values({
          sourceDocumentId: documentId,
          targetDocumentId: related[0].id,
          relationshipType: "REFERENCES",
          scope:
            verificationState === "AMBIGUOUS"
              ? "Potential relationship requires human review"
              : "Candidate relationship rejected because evidence was absent or invalid",
          confidence: 0,
          extractionMethod: "deterministic",
          verificationState,
        });
        if (verificationState === "AMBIGUOUS") {
          await db.insert(lineageAssertions).values({
            schemeId: scheme[0].id,
            documentId,
            status: "AMBIGUOUS",
            scope: "related-document relationship pending human review",
            confidence: 0,
            basis: {
              relatedDocumentId: related[0].id,
              evidenceText: candidate?.evidenceText ?? null,
            },
          });
        }
      }
    }
    await db.insert(documentArtifacts).values([
      {
        documentId,
        artifactType: "original_pdf",
        storageKey: pdfObject.key,
        contentHash: documentHash,
        mimeType: "application/pdf",
      },
      {
        documentId,
        artifactType: "extracted_text",
        storageKey: textObject.key,
        contentHash: createHash("sha256")
          .update(JSON.stringify(pageText))
          .digest("hex"),
        mimeType: "application/json",
      },
    ]);
    const chunks = createChunks(pageText);
    const semanticProfile = await createSemanticProfile(
      pageText
        .map(page => page.text)
        .join("\n")
        .slice(0, 6_000)
    );
    if (chunks.length > 0) {
      await db.insert(documentChunks).values(
        chunks.map((chunk, chunkIndex) => ({
          documentId,
          chunkIndex,
          ...chunk,
          embeddingJson: semanticProfile,
          vectorDimensions: semanticProfile.terms.length,
        }))
      );
    }
    await db
      .update(ingestionRuns)
      .set({
        documentId,
        state: "completed",
        completedAt: new Date(),
        steps: [
          {
            stage: "downloaded",
            at: new Date().toISOString(),
            sha256: documentHash,
          },
          {
            stage: "extracted",
            at: new Date().toISOString(),
            pages: pageText.length,
            chunks: chunks.length,
          },
          { stage: "indexed", at: new Date().toISOString() },
        ],
      })
      .where(
        and(eq(ingestionRuns.id, runId), eq(ingestionRuns.state, "processing"))
      );

    const inserted = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);
    return { document: inserted[0], deduplicated: false };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown ingestion failure";
    await db
      .update(ingestionRuns)
      .set({
        state: "failed",
        errorSummary: message,
        completedAt: new Date(),
        steps: [{ stage: "failed", at: new Date().toISOString(), message }],
      })
      .where(eq(ingestionRuns.id, runId));
    throw error;
  }
}
