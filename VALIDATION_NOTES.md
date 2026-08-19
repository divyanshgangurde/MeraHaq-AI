# MeraHaq AI Validation Notes

## Mock frontend visual check — desktop

The rendered landing page was inspected at a 1280px desktop viewport. The top tricolor accent, MeraHaq AI brand mark, light civic palette, centered hero, saffron-highlighted platform heading, DHRUV AI assistant label, large policy-question composer, three non-card trust indicators, restrained flowing decoration, and responsive footer all rendered as intended. The first capture revealed a missing Tailwind stylesheet import; this was corrected before the second capture. The current implementation is a mock-only preview and does not display fabricated policy documents, citations, or relationships.

## Mock frontend visual check — mobile and tablet

The landing page was inspected at 375px mobile and 768px tablet viewports. At mobile width, the navigation contracts to a menu control, the heading remains readable, the policy question composer occupies the available width, and the trust indicators stack into an accessible compact arrangement. At tablet width, the large question composer and three trust indicators remain in a balanced horizontal composition. The visual checks confirm no clipping or overlap in the inspected landing state. The interactive answer, document-detail, and graph states remain mock-only and are intentionally explicit about their unverified status.

## Mock answer and error states

The mock answer state was inspected at desktop width. It presents the submitted question, `UNVERIFIED` status, an intentionally empty citation ledger, document-detail preview control, expandable lineage preview, and explicit evidence-integrity warning without implying that a government source has been checked. The validation-error state was also inspected: short input receives an accessible alert asking for additional policy context. The interface includes visible keyboard focus styles on interactive graph nodes and form-level focus treatment on the question composer; hover and active state styles are defined for primary controls.

## Loading and lineage accessibility check

The deterministic loading state was inspected at desktop width and renders a clear progress indicator while preserving the submitted question and trust indicators. The graph’s selectable nodes use native buttons, retain a visible focus outline, expose their selected state through `aria-pressed`, and announce the selected-node summary through a polite live region. The timeline is presented as readable sequential text and the graph interaction does not depend on spatial position alone. Empty state is the initial question-only landing view; the invalid-input alert provides the error state.

The same deterministic loading, answer, and error preview routes were rechecked after the grounded-answer interface update. Their response-state treatments remain legible at desktop width, and no unverified policy facts, page references, or relationship claims are presented as verified evidence.

## Brand hierarchy validation — 19 August 2026

The rendered local landing page was inspected after the branding correction. Its browser title is **“MeraHaq AI — Government Policy Platform.”** The navigation, brand mark, and primary hero establish **MeraHaq AI** as the government policy platform before the question composer. The composer then introduces **DHRUV AI** as “Your policy guide,” with the assistant-specific question heading **“How can I help you today?”** This preserves the requested product hierarchy without changing the existing civic layout or DHRUV AI retrieval modules.

Headless responsive captures at **1280 × 720** and **768 × 1024** confirm that the full navigation and compact-menu states preserve that same hierarchy. At both widths, the MeraHaq AI mark and platform label appear before the hero, and the DHRUV AI assistant label appears immediately above the question composer. No clipping, overlap, or contrast issue was observed in either captured view.

The **375 × 812** mobile capture retains the MeraHaq AI mark, compact navigation control, readable platform label, and DHRUV AI assistant introduction above the composer. The hero and input remain within the viewport without clipping or overlap, completing desktop, tablet, and mobile verification for the branding correction.

## Live DHRUV AI answer-path validation — 19 August 2026

The browser-facing `dhruv.answer` route was exercised with a supported PM-KISAN question about the paragraph 8.1 amendment. It returned a grounded answer and a single citation to the official PM-KISAN amendment PDF at page 1. The response was correctly labeled `AMBIGUOUS` rather than claiming current applicability because the selected document’s lineage assertion is not `CURRENT_VERIFIED` in the indexed corpus.

An out-of-corpus question about a fictional subsidy returned HTTP 200 with the deterministic DHRUV AI abstention message, `UNVERIFIED` state, a caution that no validated evidence packet was cited, and an empty citation list. The answer service was hardened so that any model output without a validated evidence ID is replaced by this abstention rather than being shown to the user.

The same abstention result was confirmed from the browser context. A supported-answer browser-console call exceeded the console tool’s 30-second limit, while the endpoint completed through the standard HTTP path with a grounded PM-KISAN citation; the rendered landing page remained stable throughout that longer-running call.

The visible MeraHaq AI composer was also submitted with the supported PM-KISAN question. It accepted the full question, entered the explicit evidence-first loading state, and retained the submitted text while the DHRUV AI response was being prepared.

During that browser check, the supported-answer composer remained in its loading state beyond the first 35 seconds, although the same endpoint completed through the standard HTTP path with grounded evidence. The next refinement is therefore to provide a bounded, user-visible timeout and retry path rather than allowing an indefinite loading state.

After the refinement, the visible composer displays **“DHRUV AI is checking official evidence and policy lineage…”** while the supported request is in flight. The request retains the submitted question and is configured to move to a retry state after the bounded response window instead of loading indefinitely.

The visible supported-question flow subsequently completed with a real DHRUV AI response card. It displayed the PM-KISAN paragraph 8.1 amendment answer, an `AMBIGUOUS` verification badge, the current-applicability caution, the official PM-KISAN amendment source, page 1 reference, and a quote drawn from the indexed source text. This confirms that the MeraHaq AI composer uses the live answer route rather than a fabricated answer state.

The same visible composer was then submitted with an out-of-corpus question about a fictional subsidy. It accepted the question and entered the DHRUV AI evidence-and-lineage loading state; the final response was monitored separately to confirm the user-facing abstention result.

The out-of-corpus response completed as intended: it displayed the deterministic DHRUV AI abstention message, an `UNVERIFIED` badge, the explicit no-cited-evidence caution, and a citation ledger stating that no validated citation is available. It did not show any hypothetical rules, source URL, page number, quote, or relationship claim.
