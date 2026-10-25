import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../server/_core/app";

/**
 * Vercel Function entry point (see DEPLOY-VERCEL.md).
 *
 * Vercel serves the built Vite frontend itself from the output directory
 * configured in vercel.json; this function receives only /api/* and
 * /storage/* traffic via rewrites and hands it to the same Express app the
 * standalone server runs, minus frontend serving. The app is built once per
 * warm instance and reused across invocations (Fluid compute).
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
