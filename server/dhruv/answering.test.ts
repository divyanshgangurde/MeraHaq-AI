import { describe, expect, it } from "vitest";
import { beforeEach, vi } from "vitest";

vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "../_core/llm";
import { answerFromEvidence } from "./answering";

const mockedInvokeLLM = vi.mocked(invokeLLM);

describe("DHRUV AI grounded answering", () => {
  beforeEach(() => {
    mockedInvokeLLM.mockReset();
  });

  it("abstains before invoking a model when no validated official evidence is present", async () => {
    const result = await answerFromEvidence("What is the current rule?", [
      {
        evidenceId: 1,
        documentId: 1,
        sourceUrl: "https://example.gov.in/document.pdf",
        pageStart: 1,
        pageEnd: 1,
        quote: "A quote that is absent from the source.",
        sourceText: "Different official text.",
        title: "Invalid citation",
        lineageStatus: "UNVERIFIED",
        isOfficial: true,
      },
    ]);

    expect(result).toEqual({
      answer:
        "I cannot verify an answer from DHRUV AI’s indexed official-source corpus yet.",
      verificationState: "UNVERIFIED",
      caution:
        "No indexed official evidence with a validated source span matches this question.",
      citations: [],
    });
  });

  it("replaces uncited model prose with a deterministic abstention", async () => {
    mockedInvokeLLM.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              answer: "I can draft fictional policy rules for you.",
              citedEvidenceIds: [],
              caution: null,
            }),
          },
        },
      ],
    } as never);

    const result = await answerFromEvidence("What is the current rule?", [
      {
        evidenceId: 1,
        documentId: 1,
        sourceUrl: "https://example.gov.in/document.pdf",
        pageStart: 1,
        pageEnd: 1,
        quote: "The amendment requires an Aadhaar-linked electronic database.",
        sourceText:
          "The amendment requires an Aadhaar-linked electronic database.",
        title: "Validated official evidence",
        lineageStatus: "CURRENT_VERIFIED",
        isOfficial: true,
      },
    ]);

    expect(result).toEqual({
      answer:
        "I cannot verify an answer from DHRUV AI’s indexed official-source corpus yet.",
      verificationState: "UNVERIFIED",
      caution: "No validated evidence packet was cited for this answer.",
      citations: [],
    });
  });

  it("returns a verified answer with a validated official citation for supported evidence", async () => {
    mockedInvokeLLM.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              answer: "Paragraph 8.1 requires an Aadhaar-linked electronic database.",
              citedEvidenceIds: [7],
              caution: null,
            }),
          },
        },
      ],
    } as never);

    const result = await answerFromEvidence("What does paragraph 8.1 require?", [
      {
        evidenceId: 7,
        documentId: 9,
        sourceUrl: "https://example.gov.in/pm-kisan-amendment.pdf",
        pageStart: 1,
        pageEnd: 1,
        quote: "Paragraph 8.1 requires an Aadhaar-linked electronic database.",
        sourceText:
          "Paragraph 8.1 requires an Aadhaar-linked electronic database.",
        title: "PM-KISAN paragraph 8.1 amendment",
        lineageStatus: "CURRENT_VERIFIED",
        isOfficial: true,
      },
    ]);

    expect(result).toEqual({
      answer: "Paragraph 8.1 requires an Aadhaar-linked electronic database.",
      verificationState: "VERIFIED",
      caution: null,
      citations: [
        {
          title: "PM-KISAN paragraph 8.1 amendment",
          sourceUrl: "https://example.gov.in/pm-kisan-amendment.pdf",
          pageStart: 1,
          pageEnd: 1,
          quote:
            "Paragraph 8.1 requires an Aadhaar-linked electronic database.",
          lineageStatus: "CURRENT_VERIFIED",
        },
      ],
    });
  });
});
