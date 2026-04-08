# Tony Robbins Site — Reference Analysis
## For: Suzanne Ravenall Platform Rebuild
## Purpose: Visual and structural reference for new site design
## Crawled: 2026-04-08

---

## Design System

### Colours

| Role | Hex | Notes |
|---|---|---|
| Primary CTA / Action | `#2764ff` | Bright blue — primary buttons, UPW event |
| Brand Navy (dominant) | `#0a309d` | Main brand blue, used across backgrounds |
| Dark Navy (hero) | `#041c7f` | Deep hero and overlay backgrounds |
| Cyan accent | `#37b1ff` | Virtual events, secondary badges |
| Teal | `#21b8cd` | Life Mastery |
| Emerald | `#3ceba0` | Business Mastery |
| Green | `#6ecf55` | Wealth Mastery |
| Purple | `#8840ff` | Date With Destiny, premium |
| Yellow | `#fbf073` | Fiji / highlight |
| Text black | `#000000` | Body copy |
| Background white | `#ffffff` | Page backgrounds |

> **For Suzanne:** Use a simplified palette — single primary CTA (`#1719F4` electric blue),
> navy for hero/backgrounds (`#012B43`), white for clean sections. Drop the multi-colour
> event system — Tony's colours are per-event, Suzanne's brand is unified.

### Typography

| Font | Weights | Role |
|---|---|---|
| Suisse Intl (commercial) | 200, 400, 500, 600 | Primary display + body |
| IBM Plex Sans (free) | 400 | Secondary / UI |
| IBM Plex Mono (free) | 500 | Labels / data |

> **For Suzanne:** Poppins (already in brand) covers the weight range needed.
> Alternatively **Plus Jakarta Sans** is the closest open-source match to Suisse Intl.
> Keep Poppins as the single typeface for consistency.

Font weight roles:
- `200` — Hero display, oversized callouts
- `400` — Body, nav
- `500` — Subheadings, buttons
- `600` — Section headings, card titles

---

## Key Design Patterns

### Hero Section

**Structure:**
- Full-width background (video or high-quality photo)
- Dark overlay (60–80% opacity) to ensure text contrast
- Left-aligned content block (not centred)
- H1 in large display weight (UltraLight 200 for scale)
- Subtext paragraph below H1
- Single primary CTA button

**Tony example:** "Life is extraordinary. Unleash yours." + "Start Now" button over video background

**For Suzanne:** Same structure — full-width image/video, left-aligned, strong H1, single CTA.

---

### Navigation

**Desktop:**
- Sticky top bar (black or very dark)
- Logo top-left
- 6 primary nav items: About | Programs | Events | Coaching | Explore | Shop
- Multi-level dropdowns
- Phone number + "Schedule a call" CTA in top-right

**Mobile:**
- Hamburger collapse
- Simplified hierarchy

**For Suzanne:** Sticky dark nav, logo left, nav items: About | Services | Shop | Blog | Portal | Contact
Include "Book a call" CTA button in nav.

---

### Program/Product Cards

**Structure:**
- 16:9 aspect ratio hero image
- Colour-coded accent bar at top of card
- Category badge (type of program)
- H3 heading (the benefit, not the name — e.g., "Grow your business exponentially")
- Date/format info
- CTA button

**Grid:** `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`

**For Suzanne:** Same card structure. Lead with the transformation outcome as the H3.

---

### Trust Signals

**How Tony does it:**
- Celebrity testimonial carousel with avatar photo + short quote
- Key metrics and stats (large numbers, bold)
- Award and credibility badges
- "As seen in" media logo strip

**For Suzanne:**
- Client transformation testimonials (results-focused, not "Suzanne is great")
- Key stats: years experience, clients helped, specific outcomes
- Media appearances and credentials (Dr. prefix — leverage the doctorate)
- Medical/professional credibility indicators

---

### CTA Buttons

| Attribute | Tony's Style |
|---|---|
| Shape | Rounded (`rounded-xl` / `rounded-lg`) |
| Case | Mixed case (NOT all-caps) |
| Primary variant | Solid fill, `#2764ff` |
| Secondary variant | Muted / outline |
| Width | Inline by default, full-width in modals |
| Common labels | "Schedule a call", "Apply now", "Learn more", "Get your ticket" |

**For Suzanne:** Same rounded style. Use `#1719F4` for primary. Labels: "Book a call", "Get started", "Learn more", "Join now"

---

### Testimonials

- Avatar photo + short pull quote
- Carousel / swimlane format
- Celebrity social proof (for Tony — known names)
- Results framing: "I [achieved X outcome] after [program]"
- Video testimonials via embedded player (Vimeo)
- Displayed prominently — not buried in footer

**For Suzanne:** Client transformation quotes. Lead with the result. Include photo (trust). Video testimonials if available.

---

### Footer

**Structure:**
- Dark background (black)
- Multi-column link groups
- Social icons: Facebook, Instagram, LinkedIn, TikTok, X, YouTube, Spotify
- Legal: Privacy Policy | Terms of Service
- Support links
- No newsletter signup in footer (Tony uses modal/popup lead capture instead)

---

## Section Structure — Homepage (Top to Bottom)

1. **Navigation** — sticky dark nav with CTA
2. **Hero** — full-width video/image, H1, subtext, CTA
3. **Featured Offer** — single promoted event/program card
4. **Programs/Events Carousel** — "Events that liberate" — horizontal scroll or grid
5. **Full-Width Video CTA** — "Master every area of your life" — secondary CTA
6. **Pillars / Life Areas** — interactive cards covering all coaching areas
7. **Testimonials** — celebrity/client avatar + quote carousel
8. **Footer** — dark, multi-column, social icons

---

## Mobile Patterns

- Mobile-first Tailwind — base classes are mobile, prefixed classes scale up
- Only two breakpoints: `sm:` (640px) and `lg:` (1024px) — no `md:`
- Grid collapses to single column on mobile
- Hero heights: `h-64` mobile → `sm:h-80` tablet
- Elements hidden/shown: `hidden` / `sm:block` / `lg:block`
- Hamburger nav on mobile
- Accessibility: `aria-label`, `role="status"` on loading states

---

## What to Adopt for Suzanne's Site

1. **Full-width hero with video/dark overlay** — high impact, professional feel
2. **Left-aligned hero text** — more assertive than centred
3. **Large display weight heading in hero** — use Poppins 300/400 scaled up
4. **`max-w-7xl mx-auto px-4` container** — clean, consistent width
5. **`grid gap-6 sm:grid-cols-2 lg:grid-cols-3` card grid** — proven responsive pattern
6. **Outcome-first card headings** — lead with "What you'll achieve" not "Product name"
7. **Mixed-case rounded CTA buttons** — feels human, not corporate
8. **Celebrity/client avatar testimonial carousel** — builds instant credibility
9. **Sticky dark nav with "Book a call" CTA** — converts on every page
10. **Only `sm:` and `lg:` breakpoints** — simpler responsive logic

---

## What to Adapt

1. **Multi-colour palette** — Simplify to Suzanne's 2-colour brand (navy + electric blue)
2. **Commercial typeface (Suisse Intl)** — Use Poppins (already Suzanne's brand font)
3. **Celebrity social proof** — Replace with Dr. credentials + client transformation results
4. **Events-heavy homepage** — Reframe for coaching services + digital products
5. **HubSpot forms** — Suzanne uses Supabase + n8n; replicate the UX with own stack

---

## What to Avoid

1. **Per-product accent colour system** — Too complex, dilutes Suzanne's brand
2. **Cluttered mega-menu** — Suzanne's audience needs simplicity; keep nav clean
3. **Phone number in nav** — Not Suzanne's model (uses Cal.com booking instead)
4. **"Results Coaching" FAQ structure for every page** — Use on coaching page only
5. **IBM Plex Mono** — No monospace elements needed on Suzanne's site
