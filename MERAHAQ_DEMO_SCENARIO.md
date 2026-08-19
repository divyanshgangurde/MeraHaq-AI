# MeraHaq AI — SIH Demo Scenario

## Demonstration objective

The SIH demonstration proves that **MeraHaq AI** provides more trustworthy policy information than a baseline retriever because its embedded **DHRUV AI** assistant checks document lineage before presenting evidence as current.

## Required scenario

```text
User question
    ↓
Baseline retrieval selects an authentic but historical document
    ↓
Baseline answer presents outdated information
```

```text
User question
    ↓
DHRUV AI retrieves candidates
    ↓
DHRUV AI reads lineage evidence
    ↓
DHRUV AI identifies an amendment, correction, replacement, or other supported change
    ↓
DHRUV AI selects current applicable evidence or explicitly reports ambiguity
    ↓
DHRUV AI returns a grounded answer with citations and a policy history graph
```

## Source-chain selection gate

No document names, numbers, dates, relationships, citations, or policy changes are invented in this scenario. Before the real vertical slice is implemented, the selected chain must be verified from official government sources and entered below.

| Required document                           | Official source URL                | Document number | Authority | Publication date | Validated relationship evidence |
| ------------------------------------------- | ---------------------------------- | --------------- | --------- | ---------------- | ------------------------------- |
| Original instrument                         | Pending official-source validation | Pending         | Pending   | Pending          | Not applicable                  |
| Later amendment/modification                | Pending official-source validation | Pending         | Pending   | Pending          | Pending exact quote and page    |
| Corrigendum/replacement/extension/follow-up | Pending official-source validation | Pending         | Pending   | Pending          | Pending exact quote and page    |

## Planned user question

The final question is selected only after the chain is validated. It must be an eligibility, benefit, duration, procedure, or other factual policy question whose answer demonstrably changed between the historical and current source documents.

## Expected baseline result

The baseline retrieves the historical document because it is semantically close to the user question. The demo records the historical document ID, page-aware evidence, and outdated answer for comparison. This output is clearly labeled as **baseline comparison**, not as a DHRUV AI recommendation.

## Expected DHRUV AI result

DHRUV AI displays the following only after source validation:

| Output             | Acceptance condition                                                           |
| ------------------ | ------------------------------------------------------------------------------ |
| Applicable answer  | Grounded only in selected evidence                                             |
| Verification state | `VERIFIED`, `AMBIGUOUS`, or `UNVERIFIED` based on stored evidence              |
| Citation           | Resolves to an indexed official document, page/location, quote, and source URL |
| Policy history     | Shows the original, follow-up instruments, relationship labels, and evidence   |
| Graph              | Highlights historical, current, and ambiguous nodes/edges distinctly           |
| Warning            | Appears whenever scope or current applicability remains uncertain              |

## Demo acceptance criteria

1. The three selected documents are publicly traceable official sources.
2. Every shown relationship has a stored evidence quote and page/location.
3. The baseline and DHRUV AI select visibly different evidence in the intended failure case.
4. DHRUV AI does not display a citation without backend source-span validation.
5. The user can open the lineage graph and inspect each document and relationship.
6. An ambiguous case produces an explicit warning rather than a confident answer.
