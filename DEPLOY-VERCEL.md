# Deploying MeraHaq AI on Vercel (+ TiDB Cloud)

Prepared on the `de-manus-openrouter` branch. The app runs on Vercel as:

- **Frontend** — the Vite build (`dist/public`), served by Vercel's CDN.
- **API** — the existing Express + tRPC app as a single Vercel Function
  (`api/index.ts` → `server/_core/app.ts`), per Vercel's official Express
  guide. Rewrites in `vercel.json` send `/api/*` and `/storage/*` to it.
- **Database** — TiDB Cloud Serverless (MySQL-compatible, free tier). The
  local MariaDB cannot be reached from Vercel, so the corpus must live in
  TiDB. Answers read chunks + embeddings from the DB, nothing else.

## Part 1 — Create the TiDB Cloud database (about 5 minutes)

1. Go to https://tidbcloud.com and sign up (GitHub login is fine).
2. **Create Cluster** → **Serverless** (free) → pick the region closest to
   you (Singapore `ap-southeast-1` if offered) → create.
3. When the cluster is ready, click **Connect** → choose **Node.js / mysql2**
   (or "General" connection string) and copy the `DATABASE_URL`. It looks
   like `mysql://<user>:<password>@gateway01.<region>.prod.aws.tidbcloud.com:4000/merahaq?ssl=...`.
   Create the `merahaq` database first if the panel offers a database field
   (set it to `merahaq`).
4. Keep the password somewhere safe. Do not commit it anywhere.

## Part 2 — Fill the cloud database (pick one)

**Option A (fastest):** send the TiDB `DATABASE_URL` to Muse in chat.
It will be stored only in the local clone's gitignored `.env`, and Muse
runs the migrations + full corpus seed (JJM, PM-KISAN, NLM, with embeddings
and lineage edges) from here and verifies a live answer against TiDB.

**Option B (do it yourself):** on a machine with the branch checked out:

```bash
pnpm install
# .env must contain the TiDB DATABASE_URL and your LLM_API_KEY
npm exec --yes --package=pnpm@10.4.1 -- pnpm exec drizzle-kit migrate
npm exec --yes --package=pnpm@10.4.1 -- pnpm exec tsx scripts/seed-local.ts
npm exec --yes --package=pnpm@10.4.1 -- pnpm exec tsx scripts/graph-dump.ts
```

Expect: 5 documents, AMENDS edges VERIFIED for JJM and PM-KISAN, all
documents CURRENT_VERIFIED. (The NLM amendment stays unseeded until the
udyamimitra.in domain exception is decided; the NLM guideline seeds fine.)

## Part 3 — Deploy on Vercel (about 5 minutes)

1. Go to https://vercel.com/new and sign in with GitHub.
2. **Import** the `MeraHaq-AI` repository.
3. Framework/build settings are already pinned by `vercel.json`
   (build: `pnpm run build`, output: `dist/public`). Leave Root Directory
   as the repo root. Vercel detects pnpm from `pnpm-lock.yaml`.
4. Before deploying, open **Environment Variables** and add (Production
   and Preview):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the TiDB connection string from Part 1 |
   | `JWT_SECRET` | a fresh random secret, e.g. output of `openssl rand -hex 32` |
   | `LLM_API_KEY` | your OpenRouter key |
   | `STORAGE_DIR` | `/tmp/storage` |

   (`LLM_MODEL`, `LLM_BASE_URL`, `EMBEDDING_MODEL`, `LLM_MAX_TOKENS` have
   working defaults; override only if you want to.)
5. Click **Deploy** and wait for the build.
6. The code lives on the `de-manus-openrouter` branch. For the production
   URL to serve it: **Settings → Git → Production Branch** → set to
   `de-manus-openrouter`, then **Deployments → ⋯ → Redeploy**. (Merging the
   branch into `main` later makes this unnecessary.)

## Part 4 — Verify the deployment

1. Open the Vercel URL. The catalog should list the seeded documents.
2. Ask: "How much income support does a PM-KISAN farmer family receive per
   year, and in how many installments is it paid?"
   Expected: **VERIFIED**, Rs. 6,000 per year in three equal instalments,
   with citations to the official guidelines.
3. Ask something outside the corpus (e.g. about PMFBY premiums).
   Expected: **UNVERIFIED** abstention, no citations.

## Known limits of the Vercel deployment (honest list)

- **`/storage/*` PDF downloads will 404 on Vercel.** Serverless storage is
  ephemeral and the seeded PDFs live on this machine's disk. Citations link
  to the official gov.in source URLs, so the originals are one click away;
  answers are unaffected. Making downloads work needs an object-store swap
  (the old Forge/S3-shaped interface is still in `server/storage.ts`).
- **Do not ingest new documents through the admin UI on Vercel yet** — the
  stored file would vanish on the next cold start. Ingest via the seed
  script against TiDB instead.
- **Admin login is not configured** (Manus OAuth was removed; public Q&A
  does not need it). Replacing it is a separate step.
- Answer calls are capped at 60 s by `vercel.json` (`maxDuration`), which
  is comfortable for retrieval + one LLM call on the Hobby plan.
