import { describe, expect, it } from "vitest";
import { curatedChains } from "./curatedChains";

describe("DHRUV AI curated chain manifest", () => {
  it("tracks five curated chains without confusing planned candidates for verified evidence", () => {
    expect(curatedChains).toHaveLength(5);
    expect(
      curatedChains.filter(chain => chain.status === "VERIFIED_SOURCE_CHAIN")
    ).toHaveLength(3);
    expect(
      curatedChains.every(chain =>
        chain.sourceArchiveUrl.startsWith("https://")
      )
    ).toBe(true);
    expect(curatedChains.every(chain => chain.documents.length > 0)).toBe(true);
    // 8 verified-indexed documents: JJM KRC pair, PM-KISAN original +
    // Para 8.1 amendment + 2020 consolidated revision, NLM 2021
    // guideline + Dec 2022 amendment + Jan 2025 comprehensive guidelines.
    expect(
      curatedChains
        .flatMap(chain => chain.documents)
        .filter(document => document.documentStatus === "VERIFIED_INDEXED")
    ).toHaveLength(8);
  });
});
