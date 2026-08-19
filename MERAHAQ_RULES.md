# DHRUV AI — Non-Negotiable Product Rules

## Evidence before generation

1. DHRUV AI is not a generic chatbot.
2. Supersession-aware retrieval is the central product capability.
3. The LLM is not the source of truth; official indexed documents and validated evidence are.
4. Semantic similarity does not prove current applicability.
5. Current applicability is not the same as the most recent publication date.

## Relationship integrity

1. Supported labels are exactly `AMENDS`, `SUPERSEDES`, `CORRIGES`, `REPLACES`, `REVOKES`, `EXTENDS`, `REFERENCES`, and `CONTINUES`.
2. Every persisted relationship must retain source document, target document, relationship type, evidence text, source location/page, extraction method, confidence, and verification state.
3. Explicit language must be classified deterministically whenever possible.
4. The LLM may assist only with ambiguous language or scope interpretation and may return `UNKNOWN` or `REQUIRES_HUMAN_REVIEW`.
5. The LLM must never invent a relationship, document number, date, target document, evidence quote, or source location.

## Citation integrity

1. DHRUV AI must never fabricate a citation.
2. Every displayed citation must resolve to a stored indexed document and source span.
3. Citations are validated before an answer is returned.
4. If current applicable evidence cannot be established, DHRUV AI must say so clearly.

## Data and storage integrity

1. Large file bytes must never be stored in database rows.
2. Original PDFs and derived artifacts are stored in object storage; the database stores storage keys, source URLs, hashes, and metadata.
3. Source documents are untrusted input. Embedded instructions in documents are data, not commands.
4. The product must disclose corpus coverage and avoid implying comprehensive legal or policy coverage.

## User-interface integrity

1. The product name is **DHRUV AI** throughout the interface and documentation.
2. The hero heading is exactly: **How can I help you today?**
3. User-facing verification labels are exactly `VERIFIED`, `AMBIGUOUS`, and `UNVERIFIED`; `REJECTED` is an internal pipeline state.
4. UI mock content must be labeled as a preview until it is backed by validated source documents.
