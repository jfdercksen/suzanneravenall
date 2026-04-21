## Compound Learning — Bad Patterns

This file grows over time. When a bad pattern is caught in review, add it here so it is never repeated.

<!-- Add entries below as they are discovered during development -->
<!-- Format: - **Pattern:** description | **Why it's bad:** reason | **Do this instead:** correct approach -->

- **Pattern:** Using `bg-brand-navy` or `text-brand-navy` in Tailwind classes | **Why it's bad:** `brand-navy` is not a registered token — Tailwind silently produces no colour, so dark sections appear transparent/white | **Do this instead:** Use `bg-brand-primary` or `bg-brand-primary-900` (both resolve to #012B43 navy)
- **Pattern:** Importing `{ motion }` from `framer-motion` directly in a Next.js App Router `page.tsx` Server Component | **Why it's bad:** framer-motion is client-only — calling it from the server crashes at build with "createMotionComponent() from the server" | **Do this instead:** Extract all motion-using JSX into a separate `*Content.tsx` file with `"use client"` at the top, then import that from the page
- **Pattern:** Importing `{ Linkedin }`, `{ Instagram }`, or `{ Facebook }` from `lucide-react` | **Why it's bad:** lucide-react v1.x removed social brand icons — they are not exported and cause a TypeScript build error | **Do this instead:** Use inline SVG paths for social icons (standard brand SVGs from simpleicons.org)
