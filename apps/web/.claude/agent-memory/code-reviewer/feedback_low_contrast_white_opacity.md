---
name: feedback-low-contrast-white-opacity
description: On dark sections (bg-gray-950, bg-brand-primary, bg-gray-900 cards), text-white/40 and text-white/50 are below the project's established contrast floor — flag them like the already-fixed text-white/50 pattern
metadata:
  type: feedback
---

Commit c7bdd55 ("fix(web): raise text-white/50 to /70 on dark sections for contrast") established that `text-white/50` fails WCAG AA on the project's dark backgrounds and was raised project-wide to `/70`. That fix was not applied everywhere — `text-white/40` (even lower contrast) still recurs in some components, including ones newly modified/added.

**Why:** Found live instances during the Phase 1 redesign review: `TestimonialSpotlight.tsx` still uses `text-white/40` for the supporting-context paragraph and the CEO caption on a `bg-gray-950` section, while the near-duplicate section added in `TestimonialsContent.tsx` (new `/testimonials` page) correctly uses `text-white/60` for the same caption — i.e. the fix was applied inconsistently between the two copies of the same content block. `EventsContent.tsx`'s `LiveProgrammeCard` also uses `text-white/40` (text-xs) for programme duration on a `bg-gray-900` card.

**How to apply:** When reviewing any new or modified dark-background section (`bg-gray-950`, `bg-brand-primary`, `bg-brand-primary-900`, `bg-gray-900` cards), grep the diff for `text-white/40` and `text-white/50` and flag them as a should-fix contrast issue — recommend `/60` minimum for secondary text and `/70`+ for anything smaller than `text-sm`, consistent with c7bdd55. Also cross-check near-duplicate content blocks (e.g. a homepage spotlight component reused/duplicated into a dedicated page) for opacity drift between the two copies.
