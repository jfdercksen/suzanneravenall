## Compound Learning — Bad Patterns

This file grows over time. When a bad pattern is caught in review, add it here so it is never repeated.

<!-- Add entries below as they are discovered during development -->
<!-- Format: - **Pattern:** description | **Why it's bad:** reason | **Do this instead:** correct approach -->

- **Pattern:** Using `bg-brand-navy` or `text-brand-navy` in Tailwind classes | **Why it's bad:** `brand-navy` is not a registered token — Tailwind silently produces no colour, so dark sections appear transparent/white | **Do this instead:** Use `bg-brand-primary` or `bg-brand-primary-900` (both resolve to #012B43 navy)
