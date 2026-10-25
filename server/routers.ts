import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { listSupportedPolicyDocuments } from "./dhruv/catalog";
import { getLineageOverview } from "./dhruv/lineageOverview";
import { curatedChains } from "./dhruv/curatedChains";
import { answerPolicyQuestion } from "./dhruv/answering";
import { ingestOfficialPdf } from "./dhruv/ingestion";

export const appRouter = router({
  system: systemRouter,
  project: router({
    info: publicProcedure.query(() => ({
      title: "MeraHaq AI",
    })),
  }),
  dhruv: router({
    catalog: publicProcedure.query(() => listSupportedPolicyDocuments()),
    lineage: publicProcedure.query(() => getLineageOverview()),
    curationManifest: publicProcedure.query(() => curatedChains),
    answer: publicProcedure
      .input(
        z.object({
          question: z.string().min(5).max(2000),
          schemeSlug: z.string().min(2).max(160).optional(),
        })
      )
      .mutation(({ input }) => answerPolicyQuestion(input)),
    ingestOfficialPdf: protectedProcedure
      .input(
        z.object({
          schemeSlug: z.string().min(2).max(160),
          title: z.string().min(4).max(1024),
          issuingAuthority: z.string().min(4).max(512),
          documentType: z.enum([
            "guideline",
            "amendment",
            "clarification",
            "corrigendum",
            "notification",
            "order",
            "other",
          ]),
          sourceUrl: z.string().url().max(2048),
          issuedOn: z.date().optional(),
          relatedDocumentId: z.number().int().positive().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return ingestOfficialPdf(input);
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
