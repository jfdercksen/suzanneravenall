# Design Brief — Suzanne Ravenall New Platform
## Ai Dynamic Advisory
## Created: 2026-04-08

---

## Direction

Build Suzanne's new site to the same standard and feel as tonyrobbins.com — using Tony's site as the structural and visual reference, but with Suzanne's confirmed brand colours, fonts, and assets.

The goal: Tony Robbins-level production quality and layout sophistication, adapted for a personal transformation and performance coaching practice (not a mass-event business).

---

## Suzanne's Brand (confirmed from site audit)

| Token | Value |
|---|---|
| Primary Navy | `#012B43` |
| CTA / Accent Blue | `#1719F4` (electric blue) |
| Black | `#000000` |
| White | `#FFFFFF` |
| Amber accent (minor) | `#ffba00` |
| Primary Font | **Poppins** (Google Fonts) — 400, 600, 700 |
| Logo PNG (white) | `site-audit/assets/logos/suzanne-white-logo-1.png` |
| Logo PNG (black) | `site-audit/assets/logos/suzanne-black-logo-1.png` |

> **Note:** SVG logo not found. Request SVG from Suzanne before building header.
> PNG logos are available and usable in the interim.

---

## Reference Site

- **URL:** https://www.tonyrobbins.com
- **Screenshots:** `reference-tonyrobbins/screenshots/` *(run take-screenshots.js to populate)*
- **Design tokens:** `reference-tonyrobbins/assets/design-tokens.md`
- **Analysis:** `reference-tonyrobbins/REFERENCE-ANALYSIS.md`
- **Content structures:** `reference-tonyrobbins/content/`

---

## Key Principles (from Tony Robbins reference)

1. **Full-width hero with video or dark-overlay image** — high visual impact on first load
2. **Left-aligned hero content** — more assertive than centred layouts
3. **Large display heading with light font weight** — use Poppins 300 at scale for hero H1
4. **Outcome-first headings** — card H3s describe the transformation, not the product name
5. **Mixed-case rounded CTA buttons** — human, not corporate
6. **Sticky dark nav** with logo left + "Book a call" CTA right
7. **Client testimonials carousel** — avatar photo + result-focused quote, prominent placement
8. **`max-w-7xl mx-auto px-4`** content container — consistent across all pages
9. **`grid gap-6 sm:grid-cols-2 lg:grid-cols-3`** for all card/product grids
10. **Only `sm:` and `lg:` breakpoints** — skip `md:` for cleaner responsive logic

---

## Homepage Section Order

Adapted from Tony Robbins homepage structure for Suzanne's content:

| # | Section | Tony Equivalent | Notes |
|---|---|---|---|
| 1 | Navigation | Navigation | Sticky dark, logo left, "Book a call" right |
| 2 | Hero | Hero | Full-width image/video, H1, subtext, CTA |
| 3 | Featured Offer | Featured Event | Highlight the highest-value service/programme |
| 4 | Services / Programmes Grid | Events Carousel | Cards: Private Sessions, Group Coaching, Programmes |
| 5 | Video / Credibility CTA | Full-Width Video CTA | "Transform your life" section with dark overlay |
| 6 | Transformation Areas | Pillars Section | Suzanne's coaching areas: Performance, Mindset, etc. |
| 7 | Testimonials | Celebrity Testimonials | Client results carousel — photo + outcome quote |
| 8 | Trust Bar | Stats / Social Proof | Years experience, clients helped, Dr. credentials |
| 9 | Footer | Footer | Dark, multi-column, social icons |

---

## Navigation Style

- Sticky dark background (navy `#012B43` or black)
- Logo: left-aligned (use PNG until SVG available)
- Nav items: About | Services | Shop | Blog | Portal | Contact
- CTA button in nav: "Book a call" → links to Cal.com booking
- Mobile: hamburger collapse
- Dropdowns for Services (sub: Private Sessions, Group Sessions, Programmes)

---

## CTA Button Style

| Attribute | Value |
|---|---|
| Primary colour | `#1719F4` (electric blue) |
| Shape | Rounded (`rounded-xl`) |
| Case | Mixed case — NOT uppercase |
| Primary labels | "Book a call", "Get started", "Join now", "Learn more" |
| Secondary variant | Outline / border in `#1719F4` |

---

## Mobile Priority

60%+ of Suzanne's traffic is mobile — mobile-first always.

- Build base styles for 390px viewport first
- Scale up with `sm:` (640px) and `lg:` (1024px) only
- Hero should be full-impact at mobile: tall, large text, thumb-reachable CTA
- Navigation: hamburger from mobile up to `lg:`
- Cards: single column on mobile, 2 col at `sm:`, 3 col at `lg:`

---

## Content Available (from site audit)

| Asset | Location |
|---|---|
| All page copy | `site-audit/content/*.md` |
| Homepage structure | `site-audit/content/homepage.md` |
| Services structure | `site-audit/content/services.md` |
| All products (148) | `site-audit/content/shop-products.md` |
| Transformation pathways | `site-audit/content/transformation-pathways.md` |
| Guided programmes | `site-audit/content/guided-programmes.md` |
| About page content | `site-audit/content/about.md` |
| All site screenshots (desktop) | `site-audit/screenshots/desktop/` |
| All site screenshots (mobile) | `site-audit/screenshots/mobile/` |
| Brand images | `site-audit/assets/images/` |
| Logo files (PNG) | `site-audit/assets/logos/` |
| 301 redirect map | `site-audit/redirects-complete.json` |

---

## Tony Robbins Reference Screenshots

> **To capture:** Run the screenshot script from the reference directory:
> ```bash
> cd infra/scripts/migrations/site-audit/reference-tonyrobbins/screenshots
> npm install puppeteer
> node take-screenshots.js
> ```
>
> This will save full-page screenshots to:
> - `reference-tonyrobbins/screenshots/desktop/` (1440px)
> - `reference-tonyrobbins/screenshots/mobile/` (390px)

---

## What Claude Code Must Do for Every UI Task in Phase 1

1. Open the relevant **Tony Robbins screenshot** from `reference-tonyrobbins/screenshots/` as the layout reference
2. Open the relevant **Suzanne screenshot** from `site-audit/screenshots/` for content reference
3. Open the relevant **Suzanne content file** from `site-audit/content/` for copy
4. Build to Tony's standard using Suzanne's brand tokens and content
5. Always mobile-first — build 390px layout first
6. Always run `design-from-reference` skill with both screenshots after building
7. Always spawn `code-reviewer` and `qa-unit` after implementing

---

## Suzanne vs Tony — Key Differences to Handle

| Tony Robbins | Suzanne Ravenall |
|---|---|
| Mass events business (thousands per event) | Personal coaching practice |
| Multi-colour per-product palette | Single unified brand palette |
| Celebrity social proof | Professional credentials (Dr.) + client transformations |
| Phone number in nav | Cal.com booking CTA |
| Suisse Intl (commercial font) | Poppins (brand font, already confirmed) |
| 6 nav items with mega-menu | Cleaner 5–6 item nav, no mega-menu |
| HubSpot + Calendly | Supabase Auth + Cal.com |
