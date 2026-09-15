## Design Standard — Suzanne Ravenall Platform

The design reference for this project is tonyrobbins.com.
Every page must meet that standard. Flat, static, generic pages fail QA.

## Brand tokens (canonical — from packages/config/tailwind.config.ts)

**This is a MONOCHROME site.** Changed 2026-09-15. Every value below was read off
the live tonyrobbins.com CSS and computed styles, with the source for each one in
`docs/DESIGN-STANDARD.md`. The reference is black, white and one light grey; its
colour comes from photography. The warm palette (2 Sep) failed because Suzanne did
not like the orange/brown, and the navy/electric blue before it failed too. Do not
reintroduce a hue without Johan's say-so.

Token NAMES are historical; the VALUES are what matter:

- Dark ground: `bg-brand-primary` / `bg-brand-primary-900` (#000000). There is NO
  `brand-navy` token
- Light grounds: `bg-brand-cream` (#FFFFFF, page ground) and `bg-brand-sand`
  (#F6F6F7, the alternating band). Use these, not `bg-white` / `bg-gray-50`, for
  section backgrounds so the pairing stays in one place
- "Accent" is near-black (#171717): the CTA fill and the eyebrow label colour on
  light grounds. CTA: `bg-brand-accent-600` hover `bg-brand-accent-700`
- Body/muted text: `text-brand-ink` (#0A0A0A) and `text-brand-muted` (#696969).
  Do NOT use `text-gray-500` / `text-gray-600`
- Borders and dividers: `border-brand-border` (#E5E5E5), not `border-gray-*`
- Suzanne's navy survives as `brand-blue` (#012B43), an IDENTITY colour for logo
  lockups and marks. It is never a background

### Three rules that are easy to get wrong

1. **On a dark ground or a picture, the CTA is white.** `bg-white text-brand-primary
   hover:bg-brand-sand`. `bg-brand-accent` there is near-black on black and the
   button disappears.
2. **Labels on dark grounds use `text-brand-accent-400` (#DADBDF).** The bare
   `text-brand-accent` is near-black and only works on light grounds.
3. **Cards need a contrasting ground.** White card on `bg-brand-sand`, or a
   `bg-brand-sand` card on `bg-brand-cream`. A white card on a white ground is
   invisible without `border-brand-border`.

Every pair was contrast-checked (full table in docs/DESIGN-STANDARD.md). AA or
better throughout: ink on cream 19.80, ink on sand 18.33, muted on cream 5.49,
muted on sand 5.08, white on accent-600 17.93, accent-400 on black 15.18.

## Header rule (every hero and page header)

Suzanne, 14 Sep 2026: the headings were too big and too bold and blocked out the
background picture. The picture is the header; the text sits on it and must not
hide it.

From sm (640px) up:
- Content anchored bottom-left; the top of the frame stays clear. The description
  carries the width cap (`max-w-xl`), not the wrapper, so a CTA row can run wider
- Eyebrow: `text-xs uppercase tracking-[0.25em] font-medium text-white/80`
- Headline: `text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.05] text-white`.
  Never above 60px. Never semibold or bold over a picture
- Description: ONE paragraph at most, `text-sm sm:text-base lg:text-lg text-white/85 max-w-xl`.
  Anything more moves below the header
- Scrim: black only (never a navy/accent tint) and only behind the text band: a fade
  (`h-24 lg:h-32`, clear to `black/65`) then `from-black/85 to-black/65` behind the
  text. At black/65 over a pure-white patch of photo, white text is 6.98:1 and
  white/80 is 5.18:1, so AA holds whatever the picture shows
- CTAs on a picture: primary `bg-white text-brand-primary`; secondary
  `border border-white/50 text-white hover:bg-white/10`

Below sm (phones): if overlaid text would cover the subject's face, STACK. Picture
on top, text on black beneath it, the fade running to solid black exactly where the
picture ends. `components/home/Hero.tsx` is the reference implementation.

## Non-negotiable rules

- Use brand tokens from tailwind.config.ts — never hardcode colours
- Mobile-first — build 375px layout first, then scale to 1280px+
- Breakpoints: sm (640px) and lg (1024px) are the primary pair; md (768px) is banned; xl (1280px) is permitted ONLY for large-screen type/size scaling (e.g. xl:text-8xl, xl:h-[620px]) — never for layout restructuring
- No inline styles — Tailwind classes only
- framer-motion on every section — scroll-triggered entrance animations
- Alternate dark and light sections — never same background twice in a row.
  The light alternation is cream (white) and sand (light grey); the dark ground is
  brand-primary-900. Shared bands take a `tone` prop (see MagazineCovers)
- next/image for all images — never bare <img>, never layout shift
- next/link for internal navigation — never bare <a>
- "use client" only on components that genuinely need it (animation, state, browser API)
- No lorem ipsum — all placeholder copy must be realistic for a coaching practice

## Typography rules

- Section labels: text-xs uppercase tracking-[0.3em] font-medium text-brand-accent
  (text-brand-accent-400 on dark)
- Section headlines on flat grounds: text-4xl lg:text-6xl font-medium tracking-tight.
  Weight 500 is the measured reference weight (changed 2026-09-15 from the 600 set
  on 2026-08-20). font-light is still wrong for a statement headline: that was the
  "basic" look Johan rejected
- Headlines over a picture: font-normal, per the header rule above
- Big stats (count-up numbers): font-semibold tracking-tight
- Poppins only — no other fonts. The reference uses Suisse Intl (paid licence);
  Poppins has heavier strokes, which is why we run one weight lighter than it

## Motion rules

- Every section wrapper gets scroll-triggered entrance:
  initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
- Children stagger at 0.1s increments
- Stats count up on scroll via useInView
- Hover transitions: transition-all duration-300 minimum, duration-500 for cards
- once: true always — never re-animate on scroll back

## Card rules

- Dark cards: bg-brand-primary-800 or -900 with background image overlay at opacity-40
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
