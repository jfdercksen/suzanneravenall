## Design Standard — Suzanne Ravenall Platform

The design reference for this project is tonyrobbins.com.
Every page must meet that standard. Flat, static, generic pages fail QA.

## Brand tokens (canonical — from packages/config/tailwind.config.ts)

**This is a WARM site.** Changed 2026-09-02. The palette was previously deep navy
(#012B43) and electric blue (#1719F4), both carried over from the old WordPress
site, while the design reference has always been tonyrobbins.com — which is warm.
Three separate brightness passes failed to answer the client's "it needs to be a
warm site" note, because brightening a cold palette only produces a lighter cold.
The temperature, not the brightness, was the problem.

- Dark background: `bg-brand-primary` / `bg-brand-primary-900` (#1A1512 warm ink)
  — there is NO `brand-navy` token
- Warm amber accent: `bg-brand-accent` / `text-brand-accent` (#A84C07)
- CTA button: `bg-brand-accent-600` hover `bg-brand-accent-700`
- Light grounds: `bg-brand-cream` (#FDFAF6, page ground) and `bg-brand-sand`
  (#F5EDE3, the alternating band). Do NOT use `bg-white` or `bg-gray-50` for a
  section background — they read cold against everything else.
- Body/muted text: `text-brand-ink` (#3D342E) and `text-brand-muted` (#6E5F53).
  Do NOT use `text-gray-500` / `text-gray-600`.
- Borders and dividers: `border-brand-border` (#E7DED2), not `border-gray-*`.
- Suzanne's navy survives as `brand-blue` (#012B43) — an IDENTITY colour for logo
  lockups and marks. It is never a background again.

### Two rules that are easy to get wrong

1. **White is still allowed, but only for CARDS sitting on cream.** That contrast
   is where the depth now comes from. A white section background is a bug; a white
   card on `bg-brand-cream` is correct.
2. **Accent on dark sections uses `brand-accent-400` (#F0A952), not the default.**
   `brand-accent-600` is deliberately the dark end of the amber ramp so one token
   passes WCAG AA on both light grounds; that same token is too dark to read on
   `bg-brand-primary-900`.

Every pair in this palette was contrast-checked. AA or better throughout:
white on accent-600 5.67, accent-600 on cream 5.45, accent-600 on sand 4.89,
accent-400 on ink 8.43, ink on cream 17.1, muted on cream 5.89, muted on sand 5.29.
## Non-negotiable rules

- Use brand tokens from tailwind.config.ts — never hardcode colours
- Mobile-first — build 375px layout first, then scale to 1280px+
- Breakpoints: sm (640px) and lg (1024px) are the primary pair; md (768px) is banned; xl (1280px) is permitted ONLY for large-screen type/size scaling (e.g. xl:text-8xl, xl:h-[620px]) — never for layout restructuring
- No inline styles — Tailwind classes only
- framer-motion on every section — scroll-triggered entrance animations
- Alternate dark and light sections — never same background twice in a row.
  The light alternation is cream ↔ sand; the dark ground is brand-primary-900
- next/image for all images — never bare <img>, never layout shift
- next/link for internal navigation — never bare <a>
- "use client" only on components that genuinely need it (animation, state, browser API)
- No lorem ipsum — all placeholder copy must be realistic for a coaching practice

## Typography rules

- Section labels: text-xs uppercase tracking-[0.3em] font-medium text-brand-accent
- Section headlines: text-4xl lg:text-6xl font-semibold tracking-tight — heavy, tight statement type is the reference-site standard (changed 2026-08-20 after Johan rejected the font-light system as "basic"; the reference site's headlines are all bold/black weight)
- font-light is for supporting subheads and body-adjacent text only — never for the statement headline of a section
- Never use default (font-normal) on headlines
- Hero headline: text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight — the single loudest element on the page
- Big stats (count-up numbers): font-semibold tracking-tight, one size class up from the old font-light version
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
- Section vertical padding: py-20 lg:py-32
- Never put max-width on the section background itself

## Components

- One responsibility per component — do not combine unrelated sections
- Keep components focused and composable
- Do not over-engineer — three similar JSX blocks is better than a premature abstraction