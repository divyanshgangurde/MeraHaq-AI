import { describe, expect, it } from "vitest";
import {
  assertOfficialPdfUrl,
  assertPdfBytes,
  extractDocumentMetadata,
  referenceResolution,
  relationshipVerificationState,
} from "./ingestion";

describe("DHRUV AI official-source ingestion guard", () => {
  it("accepts an HTTPS document hosted on an official Indian government domain", () => {
    expect(
      assertOfficialPdfUrl(
        "https://pmkisan.gov.in/Documents/OPERATIONAL%20GUIDELINES.pdf"
      ).hostname
    ).toBe("pmkisan.gov.in");
  });

  it("validates PDF bytes supplied from a local byte cache", () => {
    expect(
      assertPdfBytes(Buffer.from("%PDF-1.5\nlocal cache bytes")).byteLength
    ).toBeGreaterThan(0);
    expect(() => assertPdfBytes(Buffer.from("not a pdf"))).toThrow(
      "File does not have a PDF signature"
    );
    expect(() => assertPdfBytes(Buffer.alloc(0))).toThrow(
      "PDF is empty or exceeds the configured size limit"
    );
  });

  it("rejects a non-government source before any file is fetched", () => {
    expect(() =>
      assertOfficialPdfUrl("https://example.com/document.pdf")
    ).toThrow(
      "Only HTTPS documents hosted on official Indian government domains may be ingested"
    );
  });

  it("extracts and normalizes document metadata from front-matter text", () => {
    const metadata = extractDocumentMetadata(
      [
        {
          page: 1,
          text: "Notification No. A-12/2024 dated 03/05/2024\nOperational guideline",
        },
      ],
      {
        Title: "  Example guideline  ",
        Creator: "Department",
        CreationDate: "D:20240503000000",
      }
    );

    expect(metadata).toMatchObject({
      pdfTitle: "Example guideline",
      creator: "Department",
      documentNumber: "A-12/2024",
      pageCount: 1,
    });
    expect(metadata.issuedOn?.toISOString()).toBe("2024-05-03T00:00:00.000Z");
  });

  it("routes uncertain and unsupported relationship language into explicit review states", () => {
    expect(
      referenceResolution("This revision updates the prior guideline.", true)
    ).toBe("ambiguous");
    expect(
      referenceResolution("This document describes programme context.", true)
    ).toBe("rejected");
    expect(
      referenceResolution("This revision updates the prior guideline.", false)
    ).toBe("unresolved");
    expect(
      relationshipVerificationState(
        "This revision updates the prior guideline.",
        false
      )
    ).toBe("AMBIGUOUS");
    expect(
      relationshipVerificationState(
        "This document describes programme context.",
        false
      )
    ).toBe("REJECTED");
  });
});
