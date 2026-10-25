/**
 * Build the Vercel Function bundle: api/_app.bundle.mjs
 *
 * Bundles server/_core/vercel-entry.ts with esbuild (packages external,
 * same flags as the standalone server bundle) and redirects app.ts's
 * lazy `./vite` import to server/_core/vite-stub.ts, so the Vite /
 * Tailwind / React-plugin toolchain (including native Oxide binaries)
 * stays out of the serverless function. Vercel serves the frontend
 * itself; the function only ever runs createApp({ serveFrontend:
 * false }), which never calls the stubbed functions.
 *
 * The bundle exists because Vercel's ESM loader does not resolve the
 * extensionless relative imports used across server/ — see api/index.ts.
 */
import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteStub = path.join(root, "server", "_core", "vite-stub.ts");

const stubVitePlugin = {
  name: "stub-vite",
  setup(build) {
    build.onResolve({ filter: /^\.\/vite$/ }, args => {
      if (args.importer.endsWith(path.join("_core", "app.ts"))) {
        return { path: viteStub };
      }
      return null;
    });
  },
};

await esbuild.build({
  entryPoints: [path.join(root, "server", "_core", "vercel-entry.ts")],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outfile: path.join(root, "api", "_app.bundle.mjs"),
  plugins: [stubVitePlugin],
  logLevel: "info",
});
