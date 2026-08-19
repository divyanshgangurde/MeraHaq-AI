# MeraHaq AI — Next-Chat Handoff Brief

## Copy-ready continuation context

> Continue work in `/home/ubuntu/mera-haq-ai`. The platform is **MeraHaq AI**; **DHRUV AI** is its embedded evidence-first policy assistant and RAG intelligence layer. Do not reverse this naming hierarchy, and do not rename the `server/dhruv/` modules, database tables, or tRPC namespace merely for branding purposes.

The current priority is to publish the completed version to the managed production domain. The code, local development preview, and GitHub branch are current; the public production domain is still on an earlier managed checkpoint because `webdev_save_checkpoint` repeatedly fails with a project-specific GitHub re-authorization error. Diagnose and resolve the project-level connection in the management UI, then save a checkpoint and verify production directly.

## Product contract

| Concept | Required meaning |
| --- | --- |
| **MeraHaq AI** | The full citizen-facing Indian government policy information platform: schemes, policy information, lineage, change tracking, source discovery, and verified official evidence. |
| **DHRUV AI** | The embedded assistant/RAG layer: question understanding, retrieval, lineage-aware selection, grounded answer generation, citation validation, and uncertainty communication. |
| Landing-page hierarchy | Establish MeraHaq AI as the platform first. Introduce DHRUV AI immediately above the question composer as the policy guide. |
| Evidence safety | Never fabricate a citation, document, relationship, source location, page, date, or current-applicability claim. |
| User-facing states | `VERIFIED`, `AMBIGUOUS`, and `UNVERIFIED`. `REJECTED` is internal only. |
| Relationship labels | Exactly `AMENDS`, `SUPERSEDES`, `CORRIGES`, `REPLACES`, `REVOKES`, `EXTENDS`, `REFERENCES`, `CONTINUES`. |
| Storage | Never persist large file bytes in database rows; use object storage and store only keys, URLs, hashes, and metadata in the database. |

## Current repository and deployment state

| Item | Current state |
| --- | --- |
| Project path | `/home/ubuntu/mera-haq-ai` |
| GitHub repository | `https://github.com/divyanshgangurde/MeraHaq-AI` (private) |
| Local branch / GitHub `main` | `68dff42` at the time of this handoff |
| Latest application commit | `a06d051` — live-answer safety, deterministic abstention, timeout/retry flow, and validation notes |
| Local development preview | `https://3000-iem7028l2nubr8105xfoq-bdf2d83d.us3.manus.computer` |
| Managed production domain | `https://merahaqai-lybguv47.manus.space` |
| Production state | **Stale**: shows old `DHRUV AI` product branding and pre-correction content. |
| Reason production is stale | The last managed checkpoint predates the changes. Every checkpoint attempt returns a project-level GitHub re-authorization error. |
| Temporary current preview | The development preview URL above contains the current MeraHaq AI version. It is not a replacement for durable production hosting. |

The project has an artifact remote named `origin` and a GitHub remote named `github`. GitHub source synchronization works through the `github` remote. The managed production system still requires its own authenticated project connection before checkpoint publishing can proceed.

## What is already implemented

### Frontend and branding

- `client/src/components/dhruv/BrandMark.tsx` displays **MERAHAQ AI / GOVERNMENT POLICY PLATFORM**.
- `client/src/pages/Home.tsx` establishes MeraHaq AI in the hero, then introduces **DHRUV AI · Your policy guide** above the composer.
- `client/index.html` title is **MeraHaq AI — Government Policy Platform**.
- `server/routers.ts` `project.info` returns `title: "MeraHaq AI"`.
- `VITE_APP_TITLE` is set to `MeraHaq AI` in managed configuration.
- Documentation has been updated to explain the platform/assistant distinction; do not globally replace legitimate DHRUV AI assistant references.

### Policy corpus and backend

The application uses React 19, Tailwind 4, Express, tRPC, Drizzle, and a MySQL/TiDB-compatible database. The `server/dhruv/` modules cover official PDF ingestion, source-object storage, page-aware extraction, relationship detection, evidence validation, lineage construction, hybrid retrieval, grounded answering, citation validation, semantic profiles, cataloguing, and evaluation.

The indexed corpus includes three verified amendment lineages:

1. Jal Jeevan Mission Key Resource Centres.
2. PM-KISAN operational guidelines and the paragraph 8.1 amendment.
3. National Livestock Mission operational guidelines and the December 2022 amendment order.

PMFBY and e-NAM are candidate-only chains until official-source ingestion and evidence validation are complete.

### Live answering behavior

The MeraHaq AI question composer calls the real `trpc.dhruv.answer` mutation. `MockAnswerCard.tsx` is a legacy component name but renders real response content when the `response` prop is present; it does not fabricate citations.

`server/dhruv/answering.ts` now has two important safeguards:

1. The DHRUV AI system instruction disallows invented facts, relationships, citations, hypothetical rules, alternatives, and next steps.
2. If the model returns zero validated evidence IDs, the API discards the model prose and returns the deterministic `UNVERIFIED` abstention response with no citations.

`Home.tsx` has a 25-second bounded loading window. If an answer request is still pending, the user sees an accessible timeout message and a **Try again** button. Late callbacks are guarded by a request ID, so an earlier request cannot overwrite a later retry.

## Verified end-to-end behavior

| Scenario | Observed result |
| --- | --- |
| Supported question: PM-KISAN paragraph 8.1 amendment | The visible composer returned a real answer, page-1 official PM-KISAN amendment citation, and `AMBIGUOUS` label. This is appropriate because the selected document did not have `CURRENT_VERIFIED` lineage status, so the app did not overstate current applicability. |
| Out-of-corpus fictional subsidy | The visible composer returned the deterministic DHRUV AI abstention, `UNVERIFIED`, no citation list, and no hypothetical policy rules or fabricated source metadata. |
| Responsive brand correction | Verified at 1280 × 720, 768 × 1024, and 375 × 812. MeraHaq AI appears first; DHRUV AI appears as the assistant above the composer. |
| Automated checks | `pnpm check`, `pnpm test`, and `pnpm build` passed. The test suite had 20 passing tests at the last run. |

Full records are in `VALIDATION_NOTES.md`.

## Key files

| File | Purpose |
| --- | --- |
| `client/src/pages/Home.tsx` | Platform-first hero, live DHRUV AI composer, request timeout and retry UI. |
| `client/src/components/dhruv/BrandMark.tsx` | Shared MeraHaq AI platform mark. |
| `client/src/components/dhruv/MockAnswerCard.tsx` | Rendered answer, citation ledger, status badge, and no-citation treatment; legacy filename only. |
| `server/routers.ts` | tRPC contracts; `dhruv.answer` is the live assistant mutation. |
| `server/dhruv/answering.ts` | Grounded answer service and deterministic abstention safeguard. |
| `server/dhruv/answering.test.ts` | Tests no-evidence abstention, uncited model prose suppression, and positive verified citation mapping. |
| `MERAHAQ_RULES.md` | Evidence, relationship, UI, and storage non-negotiables. |
| `PROJECT_CONTEXT.md` | Product purpose, hierarchy, scope, and terminology. |
| `PROJECT_ARCHITECTURE.md` | Technical design and RAG/lineage model. |
| `VALIDATION_NOTES.md` | Visual and live-answer validation history. |
| `todo.md` | Task tracker; preserve history and mark items accurately. |

## Remaining work, in order

1. **Resolve managed production publishing.** In the project management UI, open the project-level GitHub settings/integration and reconnect or authorize `divyanshgangurde/MeraHaq-AI`. Account-level GitHub connection alone has not been sufficient.
2. **Create a managed checkpoint.** Use `webdev_save_checkpoint` only after the connection works. Auto-publish is enabled, so a successful checkpoint should update `merahaqai-lybguv47.manus.space`.
3. **Verify production.** Navigate directly to the production domain. Confirm browser title, brand mark, hero, and composer say MeraHaq AI first and DHRUV AI second.
4. **Update `todo.md`.** Mark the managed checkpoint and live-production verification items complete only after they succeed. Commit/push that tracker update to GitHub.
5. **Re-run core validation after deployment.** At minimum run `pnpm check`, `pnpm test`, `pnpm build`, plus one supported and one out-of-corpus user-facing question.

## Safe operating constraints

- Do not rename `server/dhruv/`, database tables, or the `dhruv` tRPC namespace solely because of the platform rebrand.
- Do not turn `AMBIGUOUS` evidence into `VERIFIED` without an actual `CURRENT_VERIFIED` lineage assertion.
- Do not store file bytes in the database.
- Do not seed or write customer reviews, ratings, or testimonials.
- Do not present PMFBY or e-NAM as verified chains; they are candidates only.
- Do not silently suppress the production publishing block. The source is current, but the managed live deployment is not until a checkpoint succeeds.

## Moving to a new repository or Manus account

Creating a new private repository is a valid workaround when the current project’s managed GitHub connection cannot be repaired. The source and Git history can be copied with the following commands; replace the destination URL with the repository created in the destination GitHub account.

```bash
git clone https://github.com/divyanshgangurde/MeraHaq-AI.git
cd MeraHaq-AI
git remote rename origin old-origin
git remote add origin https://github.com/DESTINATION-ACCOUNT/NEW-REPOSITORY.git
git push -u origin main
```

In the destination account, create a new full-stack project from that repository and provide this handoff brief to the next chat. The source code will move, but managed configuration, database content, source objects, and deployment metadata are account-specific and must be recreated deliberately.

| Destination setup item | Required action |
| --- | --- |
| Repository connection | Connect the new project to the new repository at creation time and verify project-level GitHub authorization before the first checkpoint. |
| Managed secrets | Reconfigure the platform-provided values and set `VITE_APP_TITLE=MeraHaq AI`. Never copy `.env` files or secrets into Git. |
| Database schema | Apply the schema and migrations in the destination project before using the assistant. Do not assume source database rows migrate with the repository. |
| Policy corpus | Re-ingest the official source PDFs or export/import approved metadata through a controlled process. Object-storage files are not transferred by Git. |
| OAuth | Update the destination project’s production callback URL in its OAuth configuration. |
| Static and generated artifacts | Keep deployment assets outside the repository or use configured object storage; do not add large PDFs or media files to source control. |
| Production release | Run `pnpm check`, `pnpm test`, and `pnpm build`, then create a successful managed checkpoint before treating the destination production domain as current. |

The minimum safe order is: **copy the repository → create the destination full-stack project → configure secrets and OAuth → apply schema → re-ingest or migrate approved policy data → validate supported and out-of-corpus answers → create a managed checkpoint → verify production branding and behavior.**

## Recent Git history

```text
68dff42 Record DHRUV AI live answer validation
a06d051 Harden DHRUV AI live answer safety and retry flow
d185bd1 Record MeraHaq AI branding validation completion
8f51add Correct MeraHaq AI and DHRUV AI brand hierarchy
d90c521 Document managed environment configuration
```

## Suggested first message for the next chat

```text
Read NEXT_CHAT_HANDOFF.md in /home/ubuntu/mera-haq-ai first. Continue the MeraHaq AI project. The code and GitHub main branch are current, but the managed production domain is still serving an old DHRUV AI checkpoint because webdev_save_checkpoint fails with a project-level GitHub re-authorization error. Resolve that project-level publishing block, save a checkpoint, and verify that production presents MeraHaq AI as the platform and DHRUV AI as the embedded assistant. Preserve all evidence-safety and lineage rules.
```
