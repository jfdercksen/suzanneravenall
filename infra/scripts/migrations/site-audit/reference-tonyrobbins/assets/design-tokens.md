# Tony Robbins — Design Tokens
## Extracted via web crawl — 2026-04-08

---

## Colours

### Primary Brand Colours

| Role | Hex | Usage |
|---|---|---|
| Primary Blue | `#2764ff` | Primary CTAs, main actions, UPW event |
| Deep Navy | `#0a309d` | Dominant brand blue, backgrounds |
| Dark Vibrant Navy | `#041c7f` | Rich overlays, hero backgrounds |
| Cyan | `#37b1ff` | Virtual event badges, secondary accent |
| Teal | `#21b8cd` | Life Mastery, secondary accents |
| Emerald Teal | `#3ceba0` | Business Mastery, positive accents |
| Green | `#6ecf55` | Wealth Mastery, success states |
| Purple | `#8840ff` | Date With Destiny, premium tier |
| Yellow | `#fbf073` | Life & Wealth Fiji, highlight accents |
| Light Blue | `#80a9f0` | Supporting / muted blue |
| Light Green | `#beffb3` | Advanced Business Mastery |

### Neutrals

| Role | Hex |
|---|---|
| Black (primary text) | `#000000` |
| White (backgrounds) | `#ffffff` |
| Mobile browser chrome | `#000000` (meta theme-color) |

### Dark Overlay Tones (detected from image data)

| Hex | Context |
|---|---|
| `#4d1235` | Deep purple overlay |
| `#480d73` | Dark purple |
| `#753316` | Warm brown overlay |
| `#05775c` | Dark teal overlay |

---

## Typography

### Font Families

| Font | Weights | Role |
|---|---|---|
| **Suisse Intl** | 200, 400, 500, 600 | Primary display + body (COMMERCIAL — self-hosted woff2) |
| **IBM Plex Sans** | 400 | Secondary body / UI text (FREE — Google Fonts) |
| **IBM Plex Mono** | 500 | Monospace / data / labels (FREE — Google Fonts) |

Fallback stack: `"Segoe UI", Roboto, Helvetica, Arial, sans-serif`

> Note: Suisse Intl is a commercial typeface from Swiss Typefaces.
> For Suzanne's site use **Plus Jakarta Sans** (Google Fonts) as the equivalent —
> same geometric humanist character across the same weight range.

### Font Weights

| Weight | Name | Usage |
|---|---|---|
| 200 | UltraLight | Hero display text, oversized callouts |
| 400 | Regular | Body copy, nav items |
| 500 | Medium | Subheadings, button labels |
| 600 | SemiBold | Section headings, card titles |

### Type Scale (inferred from component system)

- Body base: 16px
- Secondary/label: 14px
- Page-level headings: 24px+
- Hero H1: large display (estimated 48–72px at desktop)

---

## Layout System

### Container

```
max-w-7xl mx-auto px-4
```

Standard content container used consistently across all pages.

### Grid (Card Layouts)

```
grid gap-6 sm:grid-cols-2 lg:grid-cols-3
```

- Mobile: 1 column
- Tablet (640px+): 2 columns
- Desktop (1024px+): 3 columns

### Breakpoints

Only two breakpoints used (no `md:`):
- `sm:` — 640px
- `lg:` — 1024px

### Spacing

Uses Tailwind spacing scale. Confirmed classes:
- `gap-6` — card grid gap
- `space-y-8` — section vertical spacing
- `space-y-4` — component internal spacing
- `space-y-3` — tight component spacing
- `px-4` — horizontal padding
- `py-8` — vertical section padding

---

## Component Patterns

### CTA Buttons

- Shape: rounded (`rounded-xl` / `rounded-lg`) — pill-adjacent
- Case: Mixed case — NOT uppercase (e.g., "Schedule a call", "Apply Now")
- Variants: `primary` (solid `#2764ff`) and `muted` (lower contrast)
- Width: inline by default, full-width in modal contexts
- Common button labels: "Schedule a call", "Apply now", "Learn more", "Get your ticket", "Reserve My Seat", "Start Now", "View the calendar"

### Navigation

- Desktop: horizontal top bar, multi-level dropdowns
- Logo: top-left
- CTAs in nav: phone number + "Schedule a call" button
- Mobile: hamburger collapse
- Sticky behaviour (inferred from layout)

### Hero Section

- Full-width background image or video
- Text overlay, left-aligned
- Headline in large display weight (200 UltraLight for impact)
- Subtext + single primary CTA below headline
- `fadeOut` transition effect on background
- Heights: `h-64` mobile → `sm:h-80` tablet

### Event / Product Cards

- 16:9 aspect ratio hero image
- Colour-coded accent bar per product/event
- Badge: event type (In-Person / Virtual / In-Person & Virtual)
- SVG title lockup
- Date, location
- CTA button

### Trust Bar / Social Proof

- Celebrity testimonials carousel: avatar + quote
- Stats sections with large numbers
- Awards / credibility badges

### Testimonials

- Format: avatar image + pull quote
- Carousel/swimlane layout
- Results-focused framing
- Video testimonials via Vimeo embeds

### Footer

- Multi-column layout
- Support links (Customer Support, Media Inquiries)
- Content links (Podcast, Blog, Resources, Community)
- Social: Facebook, Instagram, LinkedIn, TikTok, X, YouTube, Spotify
- Legal: Privacy Policy, Terms of Service

---

## Technology Stack (Reference)

- Framework: Next.js App Router (same as Suzanne's site)
- CSS: Tailwind CSS utility-first
- Components: Next.js CSS Modules for scoped font variables
- Forms: HubSpot embedded (Portal ID `40006127`)
- Booking: Calendly
- Analytics: Google Tag Manager `GTM-NW3PGP2L`
- Video: Vimeo embeds

---

## Adoption Notes for Suzanne's Site

| Pattern | Action |
|---|---|
| Suisse Intl typeface | Replace with Plus Jakarta Sans (Google Fonts, same feel) |
| Multi-colour event system | Simplify to single primary action colour (Suzanne's `#1719F4`) |
| `max-w-7xl mx-auto px-4` container | Adopt directly |
| `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` | Adopt directly |
| Mixed-case rounded buttons | Adopt directly |
| Full-width hero with overlay | Adopt directly |
| Only `sm:` and `lg:` breakpoints | Adopt directly — cleaner responsive logic |
| Celebrity testimonials carousel | Adapt with Suzanne's client results |
| Stats / social proof bar | Adopt pattern, populate with Suzanne's numbers |
