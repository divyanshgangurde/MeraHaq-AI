# Contributing to MeraHaq AI

Thanks for wanting to help. MeraHaq AI is a supersession-aware government policy
platform with DHRUV, an evidence-first AI assistant: it answers questions about
Indian government schemes only from official sources, and only when those
sources are still current. Please read this file before opening a pull request.

## The ground rules (non-negotiable)

These come from [`MERAHAQ_RULES.md`](./MERAHAQ_RULES.md) and the README:

- **Evidence over fluency.** A confident wrong answer about a citizen's
  entitlement is worse than no answer.
- **Official sources only.** `gov.in` / `nic.in` documents are ground truth.
  No blogs, summaries-of-summaries, or scraped FAQs as evidence.
- **Abstention is a feature.** `UNVERIFIED` is a successful outcome when the
  corpus can't support a claim — never make the assistant guess to fill a gap.
- **No fake numbers.** Every statistic, accuracy figure, or test count in code,
  docs, or PR descriptions must be measured from the running system, not
  invented or rounded up.
- **Show the uncertainty.** Coverage, lineage status, and answer state stay
  visible — never buried.

If a change touches the answering pipeline, read
[`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md),
[`PROJECT_ARCHITECTURE.md`](./PROJECT_ARCHITECTURE.md), and
[`DECISIONS.md`](./DECISIONS.md) first.

## Set up locally

Prerequisites: Node.js and [pnpm](https://pnpm.io/).

```bash
git clone https://github.com/divyanshgangurde/MeraHaq-AI.git
cd MeraHaq-AI
pnpm install
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, LLM_API_KEY
```

Rebuild the full local corpus (MariaDB + migrations + seed + lineage graph)
in one shot:

```bash
bash scripts/restore-local-db.sh
```

Then:

```bash
pnpm dev        # develop
pnpm test       # 21 tests — ingestion, answering, lineage rules, evaluation
pnpm check      # typecheck (tsc --noEmit)
pnpm build      # production build
```

Never commit `.env` or any secrets. The `.env.example` file documents every
variable; see the README's deployment table for what each one does.

## How to contribute

1. **Find or open an issue first.** Check the open issues — `good first issue`
   is the label for small, well-scoped starter tasks. If your idea has no
   issue, open one and describe the problem before writing code.
2. **Fork and branch.** Create a branch from `main` with a short, descriptive
   name, e.g. `fix/storage-404` or `feat/pmfby-corpus`.
3. **Keep PRs small and focused.** One change per PR. A PR that fixes a bug,
   adds a feature, and refactors a module will be asked to split.
4. **Run the checks before submitting:**
   ```bash
   pnpm test
   pnpm check
   ```
   Both must pass. If your change adds behaviour, add or update a test in the
   same PR — new answering/validation logic without a test will not be merged.
5. **Describe the change honestly.** In the PR body, say what changed, why,
   and how you verified it (commands run, tests added, manual check). Link the
   issue it closes. If a number appears in your description, it must be one
   you actually measured.
6. **Expect review.** Maintainers may ask for changes or for a PR to be split.
   That is normal — please respond to review comments on the PR itself.

## Reporting bugs

Open an issue with:

- What you did (steps to reproduce, or the question you asked DHRUV).
- What you expected vs. what happened (including the answer state shown:
  `VERIFIED`, `AMBIGUOUS`, `UNVERIFIED`).
- Environment: OS, Node/pnpm versions, and whether you ran locally or on the
  live demo at <https://mera-haq-ai.vercel.app>.

## Suggesting new schemes for the corpus

New scheme families are welcome, but only when their amendment lineage can be
verified from official documents. A scheme whose amendments survive only on
unofficial mirrors is not added — see the README's corpus note on the 2022 NLM
amendment order for why. Open an issue naming the scheme and linking the
official source PDFs first; do not open a PR that ingests unverified sources.

## Code style

- TypeScript throughout; run `pnpm format` (Prettier) before committing.
- Follow the existing structure: the intelligence layer lives in
  `server/dhruv/` (ingestion, lineage, retrieval, answering, validation,
  evaluation); the React app in `client/src/`; schema and migrations in
  `drizzle/`; corpus tooling in `scripts/`.
- Prefer small, named functions over clever one-liners, and keep answer-state
  handling explicit — never silently downgrade an `UNVERIFIED` result.

## Be kind

This project exists so citizens get the current rule, cited — or not claimed
at all. Treat contributors the same way: assume good faith, disagree on the
merits, and keep discussion focused on the work.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](./LICENSE).
