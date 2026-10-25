import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

export type BuiltApp = { app: Express; server: Server };

/**
 * Build the Express application without binding a port.
 *
 * Two hosts use this factory:
 *  - server/_core/index.ts — a conventional long-running Node server
 *    (local dev, Docker/Render-style hosting) with serveFrontend on, which
 *    also serves the built Vite client from dist/public.
 *  - api/index.ts — the Vercel Function entry. Vercel serves the frontend
 *    itself from the build output directory, so the function only needs the
 *    API, OAuth and /storage routes (serveFrontend off). Per Vercel's
 *    Express guide, express.static() is ignored on Vercel anyway.
 */
export async function createApp(
  options: { serveFrontend?: boolean } = {},
): Promise<BuiltApp> {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );
  if (options.serveFrontend) {
    // Loaded lazily on purpose: ./vite pulls in vite.config.ts, whose
    // top-level code assumes a bundler/ESM context (import.meta.dirname).
    // The serverless entry must never load it — its bundle stays free of
    // the whole Vite dependency tree.
    const { serveStatic, setupVite } = await import("./vite");
    // development mode uses Vite, production mode uses static files
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  }
  return { app, server };
}
