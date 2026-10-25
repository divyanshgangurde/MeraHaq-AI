import { describe, expect, it } from "vitest";
import {
  findAnchoredRelationshipEvidence,
  sentenceAnchorsToDocument,
} from "./linking";

const chunk = (content: string, page = 1) => ({
  content,
  pageStart: page,
  pageEnd: page,
});

describe("linking: sentenceAnchorsToDocument", () => {
  it("anchors on a guidelines mention", () => {
    expect(
      sentenceAnchorsToDocument(
        "Para 8.1 of the Operational Guidelines have further been amended.",
        null
      )
    ).toBe(true);
  });

  it("anchors on the target's document number without the word guidelines", () => {
    expect(
      sentenceAnchorsToDocument(
        "In supersession of F. No. R-99014/45/2021, the following order is issued.",
        "R-99014/45/2021"
      )
    ).toBe(true);
  });

  it("does not anchor topical prose", () => {
    expect(
      sentenceAnchorsToDocument(
        "The sub-mission on innovation and extension of NLM covers insurance.",
        null
      )
    ).toBe(false);
  });
});

describe("linking: findAnchoredRelationshipEvidence", () => {
  it("finds the PM-KISAN amendment sentence as anchored AMENDS evidence", () => {
    const found = findAnchoredRelationshipEvidence(
      [
        chunk(
          "AMENDMENT TO PARA 8.1 OF OPERATIONAL GUIDELINES OF PM-KISAN SCHEME. Para 8.1 of the Operational Guidelines of PM-Kisan Scheme have further been amended and shall be read as follows."
        ),
      ],
      null
    );
    expect(found?.kind).toBe("matched");
    expect(found?.detection).toMatchObject({
      state: "MATCHED",
      relationshipType: "AMENDS",
    });
  });

  it("rejects the NLM insurance-section 'extension of' collision", () => {
    // Regression (2026-10-26): this prose produced a VERIFIED EXTENDS
    // edge under whole-chunk matching. The sentence carries no document
    // anchor and, after the EXTENDS rule tightening, no match either.
    const found = findAnchoredRelationshipEvidence(
      [
        chunk(
          "In order to generate confidence among the farmers about the efficacy of the Risk Management & Insurance as component of sub-mission on innovation and extension of NLM, it is important that the policy cover should take effect once the basic formalities are complete.",
          57
        ),
      ],
      null
    );
    expect(found).toBeNull();
  });

  it("rejects bank-guarantee boilerplate that mentions reference language", () => {
    // Regression (2026-10-26): this annexure template produced a
    // VERIFIED REFERENCES edge under whole-chunk matching.
    const found = findAnchoredRelationshipEvidence(
      [
        chunk(
          "The Guarantor agrees that its liability under this guarantee shall in no manner be affected by any such variation, alteration, modification, waiver dispensation with reference to the parties hereto, and that no further consent of the Guarantor is required.",
          74
        ),
      ],
      null
    );
    expect(found).toBeNull();
  });

  it("prefers a later anchored match over an earlier unanchored keyword", () => {
    const found = findAnchoredRelationshipEvidence(
      [
        chunk("The extension of credit facilities to farmers continues."),
        chunk(
          "This order is in supersession of the Operational Guidelines issued earlier and shall take effect immediately.",
          3
        ),
      ],
      null
    );
    expect(found?.kind).toBe("matched");
    expect(found?.detection).toMatchObject({
      state: "MATCHED",
      relationshipType: "SUPERSEDES",
    });
    expect(found?.pageStart).toBe(3);
  });
});
