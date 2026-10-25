import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "./app";

/**
 * Handler source for the Vercel Function (see DEPLOY-VERCEL.md).
 *
 * This file is NOT the deployed entry. `pnpm run build:api` bundles it
 * (esbuild, packages external — the same flags as the standalone server
 * bundle) into `api/_app.bundle.mjs`, and `api/index.ts` re-exports that
 * bundle's default handler.
 *
 * Why the indirection: this repo is ESM ("type": "module"), and Vercel's
 * ESM function loader does not bundle — it transpiles file-by-file and
 * resolves imports with strict Node ESM rules, which reject the
 * extensionless relative imports used across `server/` (tsx and esbuild
 * resolve them locally, so the failure only appears on Vercel, as
 * ERR_MODULE_NOT_FOUND for '../server/_core/app'). A single pre-bundled
 * artifact has no relative imports left to resolve.
 *
 * Vercel serves the built Vite frontend itself from the output directory
 * configured in vercel.json; this function receives only /api/* and
 * /storage/* traffic via rewrites, so the app is created with
 * serveFrontend off. The app is built once per warm instance and reused
 * across invocations (Fluid compute).
 */
let builtApp: ReturnType<typeof createApp> | undefined;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  builtApp ??= createApp({ serveFrontend: false });
  const { app } = await builtApp;
  return app(req, res);
}
