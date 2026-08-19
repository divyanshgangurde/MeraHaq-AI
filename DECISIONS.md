# DHRUV AI — Architecture Decisions

| ID | Decision | Status | Rationale |
|---|---|---|---|
| ADR-001 | Use **DHRUV AI** as the product name throughout UI and documentation | Accepted | Final product naming requirement |
| ADR-002 | Build a lineage-aware retrieval system, not a generic chatbot | Accepted | Core innovation and primary success criterion |
| ADR-003 | Start with one verified document chain, then expand to three to five curated chains | Accepted | Enables a reliable SIH demonstration and prevents scope creep |
| ADR-004 | Use a relational data model for documents and directed relationship edges | Accepted | Sufficient for the MVP and avoids an unnecessary graph database |
| ADR-005 | Store source files in object storage and storage references in the database | Accepted | Keeps large file bytes out of relational rows |
| ADR-006 | Prefer deterministic relationship detection for explicit language | Accepted | Evidence-first behavior is more explainable and less error-prone |
| ADR-007 | Permit structured LLM classification only for ambiguity, never as an unsupported source of truth | Accepted | Preserves a controlled fallback while preventing invented relationships |
| ADR-008 | Validate target documents and evidence spans before persisting a model-suggested relationship | Accepted | Non-negotiable relationship integrity rule |
| ADR-009 | Use OpenAI-compatible `text-embedding-3-small` at 1536 dimensions behind an adapter | Accepted for MVP | Concrete and portable default; configurable with environment variables |
| ADR-010 | Use serialized vectors and application-side cosine scoring for the small curated corpus | Accepted for MVP | The managed project database is MySQL/TiDB-compatible, so PostgreSQL + pgvector is not selected initially; no separate vector database is needed |
| ADR-011 | Use portable BM25-style lexical scoring plus semantic scoring and lineage adjustment | Accepted | Makes retrieval testable without relying on a vendor-specific database feature |
| ADR-012 | Build the frontend mock experience before real AI, ingestion, or RAG | Accepted | Enables visual validation while avoiding fabricated policy data |
| ADR-013 | Treat evaluation as a required engine, with a simple protected UI later | Accepted | Demonstrates the central claim with measurable evidence |
| ADR-014 | Keep Manus-specific facilities behind adapters | Accepted | The core source code remains understandable and deployable outside Manus |

## Manus-specific dependencies

The current development environment supplies a managed relational database, object-storage helper, server-side model helper, authentication hooks, and deployment path. These are used only through application boundaries. If DHRUV AI is moved outside Manus, replacement database, S3-compatible storage, OpenAI-compatible model, and hosting adapters can be supplied without rewriting core lineage, retrieval, evidence, or evaluation logic.
