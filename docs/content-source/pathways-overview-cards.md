# Transformation Pathways — Overview Page Cards

Source: https://suzanneravenall.com/transformation-pathways/
Scraped: 2026-06-15 (Firecrawl `/v1/scrape`, formats: markdown + html + rawHtml, waitFor 4000, timeout 110000)
Scope: the 6 CONFIRMED pathway cards.

## Key findings (read first)

- **The pathway cards have NO per-card images.** The overview page uses a custom theme (CSS classes prefixed `sr-tp-`, **not** Elementor). Each card is a text-only `<a class="sr-tp-card">` containing a tag, an `<h3>`, a `<p>` description, and a meta row. There are **0** `background_image` entries in any `data-settings`, **no** inline `style="background-image:…"`, and **no** `<img>` inside the cards.
- **The only content background image on the page is the shared hero:** `https://suzanneravenall.com/wp-content/uploads/2023/06/header-1.jpg` — applied to `.sr-tp-hero` via a WP-Rocket lazy-render CSS variable, under a white left-to-right gradient overlay. It is the page hero, **not** tied to any individual pathway.
- All other images in the rawHtml are plugin/WooCommerce/cookie-law chrome (credit-card icons, loaders, favicon, logos) — not pathway imagery.
- **reclaim-your-power DOES have a meaningful description on the overview card** (unlike its standalone page, which is still an "under construction" stub). So its card copy is usable; only its dedicated page needs content. See its section below.
- Each card links straight to the pathway page; the visible CTA affordance is the card itself with a **"Learn More"** meta label (the featured Break the Loop block uses **"View Pathway"**).

> Net: there are no per-pathway hero/card images to harvest from this page. Pathway imagery will need to be supplied by Suzanne (or designed).

---

## break-the-loop

- **Title:** Break the Loop
- **Image URL(s):** none on the card. (Page hero only: `…/uploads/2023/06/header-1.jpg`.)
- **Description (overview):**
  - *Featured block:* "A focused entry point for people ready to recognise recurring patterns, disrupt unhelpful cycles, and begin creating a different result." — meta: *Pathway Type: Personal · Format: Multi-session*
  - *Grid card:* "Interrupt recurring cycles, increase awareness, and begin shifting long-standing internal patterns." — tag: *Personal Pathway*
- **CTA:** Featured → label **"View Pathway"**; Grid → card link, label **"Learn More"** → `https://suzanneravenall.com/break-the-loop/`
- **Cross-check vs stub page:** the individual page adds a tagline ("Recognising and interrupting the repeating patterns that keep you stuck.") + 2 short paragraphs, then "Full details… available soon."

## reclaim-your-power

- **Title:** Reclaim Your Power
- **Image URL(s):** none on the card.
- **Description (overview):** "Reconnect with your inner authority, reduce self-sabotage, and strengthen intentional action." — tag: *Personal Pathway*
- **CTA:** card link, label **"Learn More"** → `https://suzanneravenall.com/reclaim-your-power/`
- **Cross-check vs stub page:** ⚠️ The standalone page has **no real copy** ("This pathway is being prepared… under construction"). **However, the overview card here DOES provide a meaningful one-line description** (above). So it is not blank — but the full pathway content is still missing. Recommend treating the *standalone page* as needing content, while the card copy can stand in the interim. (Not a full `[CONFIRM]` blocker for the card itself.)

## reinvent-your-life

- **Title:** Reinvent Your Life
- **Image URL(s):** none on the card.
- **Description (overview):** "Create a new internal architecture for the next chapter of your life with clarity and direction." — tag: *Personal Pathway*
- **CTA:** card link, label **"Learn More"** → `https://suzanneravenall.com/reinvent-your-life/`
- **Cross-check vs stub page:** standalone page tagline "Creating a new internal foundation for the next chapter of your life." + 2 paragraphs, then "Full details… available soon."

## upgrade-your-operating-system

- **Title:** Upgrade Your Operating System
- **Image URL(s):** none on the card.
- **Description (overview):** "Challenge outdated internal programming and install stronger patterns for growth and resilience." — tag: *Personal Pathway*
- **CTA:** card link, label **"Learn More"** → `https://suzanneravenall.com/upgrade-your-operating-system/`
- **Cross-check vs stub page:** standalone page tagline "Installing a new mindset architecture for clarity, growth and transformation." + 3 paragraphs, then "Full details… available soon."

## resilience-fortification

- **Title:** Resilience & Fortification
- **Image URL(s):** none on the card.
- **Description (overview):** "Build emotional steadiness, capacity, and inner strength for navigating challenge with clarity." — tag: *Personal Pathway*
- **CTA:** card link, label **"Learn More"** → `https://suzanneravenall.com/resilience-fortification/`
- **Cross-check vs stub page:** standalone page tagline "Building inner steadiness, emotional strength, and a stronger foundation for life." + 3 paragraphs, then "Full details… available soon."

## pattern-mastery

- **Title:** Pattern Mastery
- **Image URL(s):** none on the card.
- **Description (overview):** "Move beyond awareness into mastery by learning to recognise, rewire, and lead your patterns." — tag: *Personal Pathway*
- **CTA:** card link, label **"Learn More"** → `https://suzanneravenall.com/pattern-mastery/`
- **Cross-check vs stub page:** standalone page tagline "Moving beyond awareness into deeper pattern recognition, rewiring, and personal mastery." + 3 paragraphs, then "Full details… available soon."

---

## Shared hero image (page-level, not per-pathway)

- `https://suzanneravenall.com/wp-content/uploads/2023/06/header-1.jpg`
  - Applied to `.sr-tp-hero` via `--wpr-bg-…: url('…/header-1.jpg')` (WP-Rocket lazy render) under a white gradient overlay: `linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.76) 42%, rgba(255,255,255,0.40) 100%)`.
