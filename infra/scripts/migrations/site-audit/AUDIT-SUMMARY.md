# Suzanne Ravenall — Site Audit Summary
**Generated:** 2026-04-08 (updated with sitemap crawl)
**Source:** suzanneravenall.com (WordPress + Elementor + WooCommerce)

---

## Statistics

| Item | Count |
|------|-------|
| Total URLs in sitemap | 480 |
| Core pages crawled (content extracted) | 8 |
| Products found (WooCommerce) | 148 (sitemap) / 17 (public shop) |
| Blog posts / articles / awards in sitemap | ~151 |
| Screenshots taken — desktop | 53 |
| Screenshots taken — mobile | 53 |
| Images downloaded | 39 |
| Logo files captured | 7 |
| Videos found | 0 |
| 301 redirects mapped | 472 |

---

## Design Tokens Detected

### Colours
| Hex | Usage Count | Role |
|-----|-------------|------|
| `#000000` | 37 | Primary black |
| `#FFFFFF` | 45 | White |
| `#1719F4` | 9+9 | **BRAND: Electric Blue** (CTAs, accents) |
| `#012B43` | 5 | Dark Navy (secondary) |
| `#333333` | 3 | Dark grey text |
| `#ffba00` | 2 | Amber/gold accent |

**Confirmed brand palette:** Black + Electric Blue (`#1719F4`) + Dark Navy (`#012B43`) + White

### Fonts
**Primary font: Poppins** (Google Fonts)
- Used for all headings and body text
- Weights detected: 400 (Regular), 600 (SemiBold), 700 (Bold)
- No secondary/serif font detected
- Confirm with Suzanne if a heading display font is intended

### Logo
- **Format available: PNG only** (no SVG found)
- White logo: `assets/logos/suzanne-white-logo-1.png` (6,827 bytes)
- Black logo: `assets/logos/suzanne-black-logo-1.png` (5,716 bytes)
- Favicon: `assets/logos/cropped-sr-favicon-*.png`
- **Note: SVG version not found. Request SVG from Suzanne for crisp renders at all sizes.**

---

## Site Structure

### Platform
- CMS: WordPress (version unknown)
- Page Builder: Elementor
- E-commerce: WooCommerce
- Caching: WP Rocket
- ISO 9001 certified business

### Core Pages Found
| URL | Purpose |
|-----|---------|
| / | Homepage — hero, intro, CTAs, social proof |
| /about | Dr. Ravenall bio, credentials, awards, testimonials |
| /services/private-sessions | 8 service types listed, booking CTA |
| /services/group-sessions | Group coaching services |
| /guided-programmes | Practitioner training overview |
| /transformation-pathways | 11 personal/youth pathways |
| /shop | WooCommerce catalogue (17 products) |
| /blog | Newsletter archive |
| /articles | Press/media articles |
| /media | Media appearances (7 pages) |
| /speaking | Speaking engagements |
| /awards | Awards and recognition |
| /assessments | Assessment tools |
| /masterclass2 | Lead magnet — free masterclass registration |
| /private-session | Session booking page |
| /contact | Contact form, address, social media |
| /newsletters | Newsletter archive |
| /my-account | WooCommerce customer account |

### Programme Pages (8)
- /emotional-nervous-system-mastery
- /health-energy-intelligence
- /identity-purpose-activation
- /intuition-as-patterned-intelligence
- /leadership-high-performance
- /life-transitions-reinvention
- /next-level-health-vitality-longevity
- /relationships-attachment-patterns

### WooCommerce Products (17)
See `content/shop-products.md` for complete list.

Categories:
- Books & Apps (2)
- Self-Study Audio/Video Programs (4)
- Resonance Repatterning Training — Live via Zoom (3)
- Resonance Repatterning Training — Self-Study (3)
- Akashic Navigator Programs — Live via Zoom (5)

### Legal Pages
- /privacy-policy
- /terms-and-conditions
- /disclaimer

---

## Key SEO Observations

- **No meta descriptions** on any page — all blank. Major SEO opportunity.
- **No Open Graph tags** — affects social sharing on all pages.
- Homepage and masterclass share the same H1 — needs differentiation.
- Title pattern: `[Page Name] – Suzanne Ravenall` (good, consistent)
- All 301 redirect mapping can be done from `content/all-urls.txt`

---

## Contact Details Captured
- **Email:** sravenall@suzanneravenall.com
- **Careers:** info@humanperformancereplicator.com
- **Address:** PO Box 910, Kyalami, Johannesburg, South Africa
- **Social:** Facebook, LinkedIn, Instagram

---

## Videos
**None found on public pages.** No YouTube, Vimeo, or other embeds detected.
- Course content may exist behind login (self-study products)
- Delivery is via Zoom (live programmes) — not hosted video
- Check with Suzanne about gated course video assets for Bunny Stream upload (Phase 3)

---

## Files Generated

| Directory / File | Contents |
|-----------------|----------|
| `content/all-urls.txt` | Initial 43-page URL inventory |
| `content/sitemap-all-urls.txt` | Complete 480-URL inventory from WordPress sitemaps |
| `content/*.md` | 8 priority page content files |
| `seo/ALL-SEO-DATA.json` | Page titles and H1s for priority pages |
| `screenshots/desktop/` | 53 full-page desktop screenshots (1440px) |
| `screenshots/mobile/` | 53 full-page mobile screenshots (390px) |
| `assets/logos/` | 7 logo/favicon files (PNG only — no SVG) |
| `assets/images/` | 32 images (hero, product, media, decorative) |
| `assets/videos/video-urls.txt` | No videos found |
| `assets/colours-found.txt` | Hex colour analysis |
| `assets/fonts-found.txt` | Font family analysis |
| `assets/image-urls.txt` | Complete image URL inventory |
| `redirects-complete.json` | 472 x 301 redirects — ready for next.config.mjs (Task 1.9) |
| `generate-redirects.js` | Script to regenerate redirects from updated URL list |
| `screenshot.js` | Puppeteer screenshot script (first run) |
| `screenshot-extra.js` | Puppeteer screenshot script (sitemap additions) |
| `download-assets.sh` | Asset download script |

---

## What This Unblocks

| Task | How |
|------|-----|
| **Task 1.2 Design System** | Colours: `#1719F4`, `#000000`, `#012B43`. Font: Poppins. *(Confirm SVG logo with Suzanne)* |
| **Task 1.3 Homepage** | Copy, structure, and hero images captured |
| **Task 1.4 About page** | Full headings and content structure captured |
| **Task 1.5 Services** | 8 service types documented |
| **Task 1.6 Blog** | Newsletter URL structure captured |
| **Task 1.7 Contact** | Contact details and form requirements captured |
| **Task 1.8 SEO** | All URL slugs mapped, meta description gaps identified |
| **Task 2.3 Product Migration** | 17 products catalogued with slugs |
| **301 Redirect map** | Full URL inventory in `content/all-urls.txt` |

---

## Still Needed from Suzanne

| Item | Priority | Needed For |
|------|----------|-----------|
| Logo in SVG format | High | Design System (Task 1.2) |
| Official brand colour confirmation | High | Design System (Task 1.2) |
| Official font confirmation | High | Design System (Task 1.2) |
| WooCommerce product export (prices + descriptions) | High | Shop migration (Phase 2) |
| Course video assets | Medium | Bunny Stream setup (Phase 3) |
| Final approved page copy | Medium | All page builds |
| WordPress admin access (for full content export) | Low | Content migration |
