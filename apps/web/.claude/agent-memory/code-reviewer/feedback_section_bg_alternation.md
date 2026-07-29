---
name: feedback-section-bg-alternation
description: When reviewing a new/inserted page section, always check the rendered background of its siblings in the composing page.tsx, not just the component file in isolation
metadata:
  type: feedback
---

design-rules.md requires sections to alternate dark/light and "never same background twice in a row." This is a real, recurring violation because new sections are usually reviewed as standalone component files — the violation only becomes visible by reading the page/layout file that composes them in order.

**Why:** Found in review of `ExploreDiagnosticCTA.tsx` (new) inserted between `ExploreTopicGrid` (bg-brand-primary-900) and `ExploreFinalCTA` (bg-brand-primary) in `app/explore/page.tsx` — three consecutive dark sections, and `brand-primary`/`brand-primary-900` resolve to the identical hex (#012B43) so there's zero visual break. Also found in `PathwayDetail.tsx` where a new bg-gray-50 section was inserted directly after an existing bg-gray-50 section, producing two light sections in a row across all 12 pathway pages.

**How to apply:** Whenever a diff adds/modifies a section inside a shared component (like `PathwayDetail.tsx`, used across many routes via `generateStaticParams`) or a page composition file (`app/**/page.tsx` that imports and stacks multiple section components), open the sibling section files too and list out each section's actual `bg-*` class in render order. Flag any two adjacent sections whose background token resolves to the same colour — including cases where different token names (e.g. `bg-brand-primary` vs `bg-brand-primary-900`) share the same hex value in `packages/config/tailwind.config.ts`.