import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("project.info", () => {
  it("exposes the configured MeraHaq AI title through the public application API", async () => {
    const caller = appRouter.createCaller({} as TrpcContext);

    await expect(caller.project.info()).resolves.toEqual({
      title: "MeraHaq AI",
    });
  });
});
