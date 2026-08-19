# DHRUV AI — Project Context

## Product identity

**DHRUV AI** is the product name and the user-facing policy research assistant. It helps citizens and researchers investigate Indian government policies through official, traceable documents.

## Core problem

A conventional retrieval system can return a real document that is outdated. DHRUV AI must identify relevant documents and then determine whether later amendments, corrigenda, replacements, revocations, extensions, or other supported relationships change their applicability.

## MVP boundary

The initial release is a controlled SIH prototype, not a complete national policy database. It will contain three to five curated policy chains, beginning with one independently verified demonstration chain.

## User-facing promise

Every material answer must show the selected source documents, source location or page where available, verification state, valid-as-of information when supported, and an explicit warning if applicability cannot be established.

## Terminology

| Term                | Meaning                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| Candidate retrieval | Finding documents or chunks that may answer a question                 |
| Lineage validation  | Checking evidence-backed relationships between candidate documents     |
| Applicable evidence | Evidence eligible to support a current-answer claim                    |
| Verification state  | `VERIFIED`, `AMBIGUOUS`, `UNVERIFIED`, or internal `REJECTED`          |
| Lineage graph       | Documents as nodes and evidence-backed relationships as directed edges |

## Initial development sequence

The interface is implemented and visually validated with clearly labeled mock states before real ingestion, relationship detection, or answer generation is connected. The first real vertical slice is then built around one validated government document chain.
