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
    expect(
      curatedChains
        .flatMap(chain => chain.documents)
        .filter(document => document.documentStatus === "VERIFIED_INDEXED")
    ).toHaveLength(6);
  });
});
