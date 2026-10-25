/**
 * Type declaration for the esbuild-generated Vercel function bundle.
 * The bundle is produced by `pnpm run build:api` from
 * `server/_core/vercel-entry.ts`; it is a build artifact, not source,
 * so its handler type is declared here instead of inferred.
 */
declare module "*.bundle.mjs" {
  import type { IncomingMessage, ServerResponse } from "http";
  const handler: (
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<void>;
  export default handler;
}
