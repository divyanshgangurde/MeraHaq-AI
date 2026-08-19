# MeraHaq AI

MeraHaq AI is a supersession-aware government policy information platform. **DHRUV AI** is its embedded AI-powered policy assistant, responsible for question understanding, retrieval, lineage-aware evidence selection, grounded answer generation, citation validation, and uncertainty communication.

> **MeraHaq AI does not treat semantic relevance as proof of current applicability; DHRUV AI must validate evidence before presenting an answer.**

## Product scope

The MVP covers a small, curated corpus of three to five policy chains. MeraHaq AI currently includes three independently verified amendment lineages and two clearly marked candidate-only chains. The platform always shows supported coverage and displays uncertainty instead of making unsupported claims.

## Core capabilities

| Capability         | MVP behavior                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------ |
| DHRUV AI answering | Provides a grounded assistant response with only validated citations                       |
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

The approved project workflow uses managed project settings instead of a committed `.env.example` file. This is intentional: local environment files are protected by the project platform so that application credentials cannot be accidentally added to source control. The public product title is configured as `MeraHaq AI`; the application also enforces this title through its public project-information contract.

For a portable deployment outside the managed project environment, create a local, untracked environment file from the following **placeholder-only** template. Replace values in your deployment secret manager; never commit the resulting file.

```dotenv
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace-with-a-long-random-local-secret
VITE_APP_TITLE=MeraHaq AI
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

Core policy, lineage, retrieval, validation, evaluation, and orchestration logic must remain conventional TypeScript source code in this repository. Platform-specific database, storage, model, and deployment facilities are isolated behind adapters so that MeraHaq AI, including its DHRUV AI intelligence layer, can be deployed outside Manus with reasonable effort.

## Current project phase

MeraHaq AI now includes a polished evidence-first interface, guarded official-PDF ingestion, source-object storage, page-aware extraction, deterministic relationship classification, policy lineage, and evaluation utilities. Its embedded DHRUV AI assistant provides lineage-aware retrieval, citation validation, and grounded answer generation. Three official source lineages—Jal Jeevan Mission Key Resource Centres, PM-KISAN, and National Livestock Mission—are indexed with verified `AMENDS` relationships. PMFBY and e-NAM remain explicit candidate-only chains until their source documents are independently ingested and validated.
