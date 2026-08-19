# DHRUV AI

DHRUV AI is a civic-focused research platform for Indian government policy. It is designed to answer policy questions using traceable official documents while checking whether the retrieved documents remain applicable through an evidence-backed policy lineage.

> **DHRUV AI does not treat semantic relevance as proof of current applicability.**

## Product scope

The MVP will cover a small, curated corpus of three to five policy chains. It begins with one verified vertical slice containing an original document, a later change, and a follow-up document. The application will always show its supported coverage and will display uncertainty instead of making unsupported claims.

## Core capabilities

| Capability | MVP behavior |
|---|---|
| Question answering | Provides a grounded response with only validated citations |
| Policy lineage | Shows document nodes, evidence-backed relationships, and current/historical status |
| Verification | Uses `VERIFIED`, `AMBIGUOUS`, `UNVERIFIED`, and internal `REJECTED` states |
| Retrieval | Combines lexical and semantic candidates, then applies lineage-aware filtering and ranking |
| Evaluation | Compares a baseline retrieval path against DHRUV AI on curated gold cases |

## Local development

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

## Repository documents

| File | Purpose |
|---|---|
| `PROJECT_CONTEXT.md` | Product purpose, scope, and terminology |
| `MERAHAQ_RULES.md` | Non-negotiable evidence and safety rules |
| `PROJECT_ARCHITECTURE.md` | Portable technical architecture and concrete retrieval design |
| `DECISIONS.md` | Explicit architectural decisions and Manus-specific boundaries |
| `MERAHAQ_DEMO_SCENARIO.md` | SIH demonstration target and acceptance criteria |
| `.env.example` | Placeholder environment configuration with no secrets |

## Portability

Core policy, lineage, retrieval, validation, evaluation, and orchestration logic must remain conventional TypeScript source code in this repository. Platform-specific database, storage, model, and deployment facilities are isolated behind adapters so that DHRUV AI can be deployed outside Manus with reasonable effort.

## Current project phase

The repository has been initialized. The next implementation milestone is a polished mock DHRUV AI experience; real document ingestion and RAG integration will be introduced only after the mock user journey is stable.
