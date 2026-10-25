import type { Express } from "express";
import type { Server } from "http";

/**
 * Stub for `./vite`, used ONLY in the serverless bundle
 * (scripts/build-api.mjs redirects the `./vite` import here).
 *
 * The real `./vite` pulls in the Vite dev server and `vite.config.ts`
 * (Tailwind, React plugin, native Oxide binaries). None of that may ship
 * in the Vercel Function: Vercel serves the frontend itself, `createApp`
 * is called with `serveFrontend: false`, and the native build tooling
 * bloats the function and can fail to load in the serverless runtime.
 * If this stub is ever actually called, the deployment is misconfigured
 * and failing loudly is the correct behavior.
 */
export async function setupVite(_app: Express, _server: Server) {
  throw new Error(
    "setupVite is unavailable in the serverless bundle (Vercel serves the frontend).",
  );
}

export function serveStatic(_app: Express) {
  throw new Error(
    "serveStatic is unavailable in the serverless bundle (Vercel serves the frontend).",
  );
}
