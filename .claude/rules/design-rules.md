## Design Standard — Suzanne Ravenall Platform

The design reference for this project is tonyrobbins.com.
Every page must meet that standard. Flat, static, generic pages fail QA.

## Brand tokens (canonical — from packages/config/tailwind.config.ts)

- Navy/dark background: `bg-brand-primary` or `bg-brand-primary-900` (#012B43) — there is NO `brand-navy` token
- Electric blue accent: `bg-brand-accent` / `text-brand-accent` (#1719F4)
- CTA button: `bg-brand-accent-600` hover `bg-brand-accent-700`
## Non-negotiable rules

- Use brand tokens from tailwind.config.ts — never hardcode colours
- Mobile-first — build 375px layout first, then scale to 1280px+
- No inline styles — Tailwind classes only
- framer-motion on every section — scroll-triggered entrance animations
- Alternate dark and light sections — never same background twice in a row
- next/image for all images — never bare <img>, never layout shift
- next/link for internal navigation — never bare <a>
- "use client" only on components that genuinely need it (animation, state, browser API)
- No lorem ipsum — all placeholder copy must be realistic for a coaching practice

## Typography rules

- Section labels: text-xs uppercase tracking-[0.3em] font-medium text-brand-accent
- Section headlines: text-4xl md:text-6xl font-light
- Never use default (font-normal) on headlines — always font-light or font-semibold
- Poppins only — no other fonts

## Motion rules

- Every section wrapper gets scroll-triggered entrance:
  initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
- Children stagger at 0.1s increments
- Stats count up on scroll via useInView
- Hover transitions: transition-all duration-300 minimum, duration-500 for cards
- once: true always — never re-animate on scroll back

## Card rules

- Dark cards: bg-gray-900 with background image overlay at opacity-40
- Hover: overlay fades (opacity-20), card lifts (shadow-2xl, -translate-y-1)
- Use group + group-hover for coordinated multi-element hover effects

## Section structure rules

- Section background is always full-bleed (w-full)
- Content container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Section vertical padding: py-20 md:py-32
- Never put max-width on the section background itself

## Components

- One responsibility per component — do not combine unrelated sections
- Keep components focused and composable
- Do not over-engineer — three similar JSX blocks is better than a premature abstraction