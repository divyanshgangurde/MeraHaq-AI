import { describe, expect, it } from "vitest";
import { answerFromEvidence } from "./answering";

describe("DHRUV AI grounded answering", () => {
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
});
