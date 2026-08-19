# MeraHaq AI — Project Context

## Product identity

**MeraHaq AI** is the supersession-aware government policy information platform. It helps citizens and researchers discover schemes, understand policy information, track change, inspect document lineage, and access verified government sources.

**DHRUV AI** is MeraHaq AI’s embedded policy assistant and RAG intelligence layer. It understands questions, retrieves evidence, evaluates lineage, generates grounded answers, validates citations, and communicates uncertainty.

## Core problem

A conventional retrieval system can return a real document that is outdated. MeraHaq AI uses DHRUV AI to identify relevant documents and determine whether later amendments, corrigenda, replacements, revocations, extensions, or other supported relationships change their applicability.

## MVP boundary

The initial release is a controlled SIH prototype, not a complete national policy database. It will contain three to five curated policy chains, beginning with one independently verified demonstration chain.

## User-facing promise

Every material answer must show the selected source documents, source location or page where available, verification state, valid-as-of information when supported, and an explicit warning if applicability cannot be established.

## Terminology

| Term                | Meaning                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| MeraHaq AI          | The complete citizen-facing government policy platform                 |
| DHRUV AI            | The platform’s AI policy assistant and RAG intelligence layer          |
| Candidate retrieval | Finding documents or chunks that may answer a question                 |
| Lineage validation  | Checking evidence-backed relationships between candidate documents     |
| Applicable evidence | Evidence eligible to support a current-answer claim                    |
| Verification state  | `VERIFIED`, `AMBIGUOUS`, `UNVERIFIED`, or internal `REJECTED`          |
| Lineage graph       | Documents as nodes and evidence-backed relationships as directed edges |

## Initial development sequence

The interface is implemented and visually validated with clearly labeled answer states. MeraHaq AI now contains verified source lineages, while DHRUV AI powers grounded policy retrieval and assistant responses over that curated corpus.
