import { describe, expect, it } from "vitest";
import {
  diffLinkSets,
  extractPdfLinks,
  fingerprintLinkSet,
} from "./discovery";

describe("discovery: extractPdfLinks", () => {
  const html = `
    <a href="/sites/default/files/guideline/new-doc.pdf">New</a>
    <a href="https://dahd.gov.in/files/abs.pdf">Absolute</a>
    <a href="https://example.com/mirror.pdf">Aggregator mirror</a>
    <a href="http://dahd.gov.in/insecure.pdf">HTTP, not HTTPS</a>
    <a href="/guidelines">Not a PDF</a>
    <a href="/sites/default/files/guideline/new-doc.pdf">Duplicate</a>
  `;

  it("keeps only HTTPS PDFs on official hosts, resolved and deduped", () => {
    const links = extractPdfLinks(html, "https://dahd.gov.in/en/node/345");
    expect(links).toEqual([
      "https://dahd.gov.in/files/abs.pdf",
      "https://dahd.gov.in/sites/default/files/guideline/new-doc.pdf",
    ]);
  });
});

describe("discovery: fingerprintLinkSet", () => {
  it("is order-independent and duplicate-insensitive", () => {
    const a = fingerprintLinkSet(["https://x.gov.in/b.pdf", "https://x.gov.in/a.pdf"]);
    const b = fingerprintLinkSet([
      "https://x.gov.in/a.pdf",
      "https://x.gov.in/b.pdf",
      "https://x.gov.in/a.pdf",
    ]);
    expect(a).toBe(b);
  });

  it("changes when the set changes", () => {
    const a = fingerprintLinkSet(["https://x.gov.in/a.pdf"]);
    const b = fingerprintLinkSet(["https://x.gov.in/a.pdf", "https://x.gov.in/b.pdf"]);
    expect(a).not.toBe(b);
  });
});

describe("discovery: diffLinkSets", () => {
  it("separates untracked discoveries from tracked-but-unseen URLs", () => {
    const diff = diffLinkSets(
      ["https://x.gov.in/known.pdf", "https://x.gov.in/unseen.pdf"],
      ["https://x.gov.in/known.pdf", "https://x.gov.in/new.pdf"]
    );
    expect(diff.added).toEqual(["https://x.gov.in/new.pdf"]);
    expect(diff.notSeen).toEqual(["https://x.gov.in/unseen.pdf"]);
    expect(diff.seenCount).toBe(1);
  });
});
