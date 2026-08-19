# DHRUV AI

DHRUV AI is a civic-focused research platform for Indian government policy. It is designed to answer policy questions using traceable official documents while checking whether the retrieved documents remain applicable through an evidence-backed policy lineage.

> **DHRUV AI does not treat semantic relevance as proof of current applicability.**

## Product scope

The MVP will cover a small, curated corpus of three to five policy chains. It begins with one verified vertical slice containing an original document, a later change, and a follow-up document. The application will always show its supported coverage and will display uncertainty instead of making unsupported claims.

## Core capabilities

| Capability         | MVP behavior                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Question answering | Provides a grounded response with only validated citations                                 |
| Policy lineage     | Shows document nodes, evidence-backed relationships, and current/historical status         |
| Verification       | Uses `VERIFIED`, `AMBIGUOUS`, `UNVERIFIED`, and internal `REJECTED` states                 |
| Retrieval          | Combines lexical and semantic candidates, then applies lineage-aware filtering and ranking |
| Evaluation         | Compares a baseline retrieval path against DHRUV AI on curated gold cases                  |

## Local development

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

## Repository documents

| File                       | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `PROJECT_CONTEXT.md`       | Product purpose, scope, and terminology                        |
| `MERAHAQ_RULES.md`         | Non-negotiable evidence and safety rules                       |
| `PROJECT_ARCHITECTURE.md`  | Portable technical architecture and concrete retrieval design  |
| `DECISIONS.md`             | Explicit architectural decisions and Manus-specific boundaries |
| `MERAHAQ_DEMO_SCENARIO.md` | SIH demonstration target and acceptance criteria               |
| Managed project settings   | Secure runtime configuration, maintained through project settings rather than a committed environment file |

## Managed environment configuration

The approved project workflow uses managed project settings instead of a committed `.env.example` file. This is intentional: local environment files are protected by the project platform so that application credentials cannot be accidentally added to source control. The public product title is configured as `DHRUV AI`; the application also enforces this title through its public project-information contract.

For a portable deployment outside the managed project environment, create a local, untracked environment file from the following **placeholder-only** template. Replace values in your deployment secret manager; never commit the resulting file.

```dotenv
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace-with-a-long-random-local-secret
VITE_APP_TITLE=DHRUV AI
VITE_APP_ID=
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=
VITE_FRONTEND_FORGE_API_KEY=
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

## Portability

Core policy, lineage, retrieval, validation, evaluation, and orchestration logic must remain conventional TypeScript source code in this repository. Platform-specific database, storage, model, and deployment facilities are isolated behind adapters so that DHRUV AI can be deployed outside Manus with reasonable effort.

## Current project phase

DHRUV AI now includes a polished evidence-first interface, guarded official-PDF ingestion, source-object storage, page-aware extraction, deterministic relationship classification, lineage-aware retrieval, citation validation, and evaluation utilities. Three official source lineages—Jal Jeevan Mission Key Resource Centres, PM-KISAN, and National Livestock Mission—are indexed with verified `AMENDS` relationships. PMFBY and e-NAM remain explicit candidate-only chains until their source documents are independently ingested and validated.
