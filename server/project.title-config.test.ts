import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("project.info title configuration", () => {
  it("exposes the configured MeraHaq AI title through the public project endpoint", async () => {
    const caller = appRouter.createCaller({} as never);
    const result = await caller.project.info();

    expect(result.title).toBe("MeraHaq AI");
  });
});
