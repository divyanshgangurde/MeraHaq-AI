# DHRUV AI Validation Notes

## Mock frontend visual check — desktop

The rendered landing page was inspected at a 1280px desktop viewport. The top tricolor accent, DHRUV AI brand mark, light civic palette, centered hero, saffron-highlighted required heading, large policy-question composer, three non-card trust indicators, restrained flowing decoration, and responsive footer all rendered as intended. The first capture revealed a missing Tailwind stylesheet import; this was corrected before the second capture. The current implementation is a mock-only preview and does not display fabricated policy documents, citations, or relationships.

## Mock frontend visual check — mobile and tablet

The landing page was inspected at 375px mobile and 768px tablet viewports. At mobile width, the navigation contracts to a menu control, the heading remains readable, the policy question composer occupies the available width, and the trust indicators stack into an accessible compact arrangement. At tablet width, the large question composer and three trust indicators remain in a balanced horizontal composition. The visual checks confirm no clipping or overlap in the inspected landing state. The interactive answer, document-detail, and graph states remain mock-only and are intentionally explicit about their unverified status.

## Mock answer and error states

The mock answer state was inspected at desktop width. It presents the submitted question, `UNVERIFIED` status, an intentionally empty citation ledger, document-detail preview control, expandable lineage preview, and explicit evidence-integrity warning without implying that a government source has been checked. The validation-error state was also inspected: short input receives an accessible alert asking for additional policy context. The interface includes visible keyboard focus styles on interactive graph nodes and form-level focus treatment on the question composer; hover and active state styles are defined for primary controls.

## Loading and lineage accessibility check

The deterministic loading state was inspected at desktop width and renders a clear progress indicator while preserving the submitted question and trust indicators. The graph’s selectable nodes use native buttons, retain a visible focus outline, expose their selected state through `aria-pressed`, and announce the selected-node summary through a polite live region. The timeline is presented as readable sequential text and the graph interaction does not depend on spatial position alone. Empty state is the initial question-only landing view; the invalid-input alert provides the error state.
