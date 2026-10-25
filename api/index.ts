/**
 * Vercel Function entry point (see DEPLOY-VERCEL.md).
 *
 * This is intentionally a thin re-export of a pre-bundled artifact.
 * Vercel's ESM function loader resolves relative imports with strict
 * Node ESM rules (explicit extensions, no bundling for "type": "module"
 * projects), while the server code in `server/` uses extensionless
 * relative imports throughout. Serving the raw graph therefore fails on
 * Vercel with ERR_MODULE_NOT_FOUND ('../server/_core/app') even though
 * the same code runs under tsx/esbuild locally.
 *
 * `pnpm run build` regenerates `api/_app.bundle.mjs` from
 * `server/_core/vercel-entry.ts` with esbuild (packages external), so
 * the bundle contains the whole app graph with no relative imports left
 * to resolve. Do not reintroduce direct imports of `server/` here.
 */
import handler from "./_app.bundle.mjs";

export default handler;
