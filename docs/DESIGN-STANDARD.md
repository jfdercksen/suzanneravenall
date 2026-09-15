# Design standard

Adopted 15 Sep 2026. Supersedes the warm palette of 2 Sep 2026 and the navy / electric blue palette before it.

**Direction (Johan, 15 Sep 2026):** no orange, no brown, and not the old navy or electric blue. The reference is tonyrobbins.com. Headers everywhere get a smaller, lighter heading and less description text so the background picture is visible. This answers Suzanne's 14 Sep note: the headings were too big and too bold and blocked out the picture, and she was not keen on the orange/brown.

The rules that code must follow are in `.claude/rules/design-rules.md`. This file records where every value came from.

---

## 1. What tonyrobbins.com actually uses

Measured 15 Sep 2026, two ways:

1. Fetched `https://www.tonyrobbins.com/` and its three stylesheets (`/_next/static/chunks/01diptnonh4g8.css`, `0xk3chmxox6.o.css`, `0o7s~nivrs1sq.css`) and read the CSS custom properties.
2. Loaded the live page in a browser at 1280x800 and 375x812 and read the computed styles of the rendered elements (backgrounds weighted by area, text colours by count, buttons, headings).

### Colour

| Role | Value | Source |
|---|---|---|
| Dark ground (header, dark sections) | `#000000` | CSS `--tr-black`; computed header background `rgb(0,0,0)` |
| Near-black surface (hero frame) | `#232325` | CSS `--tr-black-1` (class `bg-primary-1`) |
| Near-black, second step | `#303134` | CSS `--tr-black-2` |
| Light ground | `#FFFFFF` | CSS `--tr-white`, `--background` |
| Light grey band, light buttons | `#F6F6F7` | CSS `--tr-white-1`; computed fill of 12 buttons |
| Light grey, second step | `#DADBDF` | CSS `--tr-white-2` |
| Body text | `#0A0A0A` | CSS `--foreground` |
| Dark button fill | `#171717` | CSS `--primary` |
| Muted text | `#696969` | computed colour of 23 text elements (CSS `--muted-foreground` is `#737373`) |
| Borders | `#E5E5E5` | CSS `--border` |
| Secondary text on dark | white at 70% | computed |
| Glass button on dark | white at 10% fill, white text | computed on 17 buttons |
| The only colour accent | `#2764FF` | CSS `--tr-blue`; used on the announcement bar and nowhere in the page body |
| Hero scrim | deep blue `#022886` to transparent, bottom two thirds of the photo | hero class `absolute inset-x-0 top-1/3 bottom-0 bg-gradient-to-t from-[#022886]` |

By painted area the page is black (10.5M px²), white (7.5M px²) and `#F6F6F7` (3.7M px²). Everything else is photography or small feature cards. **The reference site is monochrome. Its colour comes from the pictures.** Sections switch between a `.theme--dark` class (black ground, white text) and a `.theme--light` class (white ground, black text).

### Type

| Element | Value | Source |
|---|---|---|
| Headline font | Suisse Intl (commercial licence), weights 100 / 400 / 500 / 600 | `@font-face` in the stylesheet |
| Eyebrow labels | IBM Plex Mono, 14px, uppercase | `@font-face` + computed |
| Body | 16px / 24px, weight 400 | computed |
| Hero headline | 70.4px desktop, 48px at 375px; weight **500**; line height 0.9; letter spacing -0.05em | computed |
| Section headline | 57.6px desktop, 39.5px at 375px; weight **500** | computed |
| Hero content | headline plus one button, anchored bottom-left; **no description paragraph** | observed |
| Buttons | fully rounded pills, 14 to 16px, weight 400 to 500, sentence case | computed |

---

## 2. Mapping onto our tokens

Token names are kept so the ~100 files that use them do not churn. `cream` and `sand` are now historical names for white and light grey. Both token files are kept in step: `packages/config/tailwind.config.ts` and `packages/ui/src/tokens.ts`.

| Token | Role | Was (2 Sep) | Now | Source |
|---|---|---|---|---|
| `brand-primary` / `-900` | dark ground | `#1A1512` | `#000000` | `--tr-black` |
| `brand-primary-800` | | `#2A211B` | `#171717` | `--primary` |
| `brand-primary-700` | | `#40332A` | `#232325` | `--tr-black-1` |
| `brand-primary-600` | | `#5C4B3E` | `#303134` | `--tr-black-2` |
| `brand-primary-500` | | `#7A6656` | `#525252` | derived |
| `brand-primary-400` | | `#9C8878` | `#737373` | `--muted-foreground` |
| `brand-primary-300` | | `#C0AE9E` | `#A3A3A3` | dark-theme `--muted-foreground` |
| `brand-primary-200` | | `#DBCEC2` | `#DADBDF` | `--tr-white-2` |
| `brand-primary-100` | | `#EFE8E1` | `#F6F6F7` | `--tr-white-1` |
| `brand-accent` / `-600` | CTA fill on light grounds, labels on light | `#A84C07` | `#171717` | `--primary` |
| `brand-accent-700` | CTA hover | `#8F4108` | `#000000` | `--tr-black` |
| `brand-accent-400` | label colour on dark grounds | `#F0A952` | `#DADBDF` | `--tr-white-2` |
| `brand-accent-500` | | `#D97706` | `#737373` | `--muted-foreground` |
| `brand-accent-100 / 200 / 300` | | amber tints | `#F6F6F7` / `#EEEEF0` / `#E5E5E5` | `--tr-white-1` / derived / `--border` |
| `brand-cream` | page ground | `#FDFAF6` | `#FFFFFF` | `--tr-white` |
| `brand-sand` | alternating band, card fill | `#F5EDE3` | `#F6F6F7` | `--tr-white-1` |
| `brand-border` | dividers, card borders | `#E7DED2` | `#E5E5E5` | `--border` |
| `brand-ink` | body text | `#3D342E` | `#0A0A0A` | `--foreground` |
| `brand-muted` | muted text | `#6E5F53` | `#696969` | computed |
| `brand-blue` | Suzanne's navy, identity only (logo lockups) | `#012B43` | unchanged | not a background |
| `brand-amber` | legacy badge, book page only | `#FFBA00` | unchanged for now | remove in the book page pass |
| glow keyframes | `pulse-glow`, `brain-glow`, `brain-pulse` | `#D97706` | white light | no colour accent exists |

### Taken from the reference, deliberately not adopted

These are decisions for Johan, not oversights.

| Reference has | We kept | Why | Cost to adopt |
|---|---|---|---|
| Suisse Intl | Poppins | Suisse Intl is a paid licence; Poppins is the brand font. Poppins strokes are wider and heavier, so we run one weight lighter to match (400 where the reference uses 500 over photos) | font licence + a sitewide type check |
| Pill buttons | 12px corner radius | not part of the 15 Sep direction | one token: `borderRadius.button` to `9999px` |
| Blue `#2764FF` accent | no colour accent at all | the direction rules out navy and electric blue | a new token and a decision on where it goes |
| Sentence-case buttons | uppercase, wide tracking | copy and structure are out of scope | one class per button |

---

## 3. Contrast

WCAG AA: 4.5:1 for normal text, 3:1 for large text (24px and up, or 18.66px bold) and for UI shapes.

| Pair | Ratio | Result |
|---|---|---|
| Body `#0A0A0A` on white | 19.80 | AA |
| Body `#0A0A0A` on light grey `#F6F6F7` | 18.33 | AA |
| Muted `#696969` on white | 5.49 | AA |
| Muted `#696969` on light grey | 5.08 | AA |
| White on CTA `#171717` | 17.93 | AA |
| White on hover state `#000000` | 21.00 | AA |
| CTA `#171717` against white ground (shape) | 17.93 | AA |
| Label `#DADBDF` on black | 15.18 | AA |
| Label `#DADBDF` on `#232325` | 11.34 | AA |
| White on black | 21.00 | AA |
| White at 70% on black | 10.02 | AA |
| Black text on a white button | 21.00 | AA |
| White on the hero scrim at its lightest (black at 65% over a pure-white patch of photo) | 6.98 | AA |
| White at 85% on that same worst case (description) | 5.60 | AA |
| White at 80% on that same worst case (eyebrow) | 5.18 | AA |

The scrim rows are the worst case: they assume the photograph is pure white behind the text. Any real photo is darker, so real contrast is higher.

---

## 4. The header rule

Applies to the homepage hero and every page-header or hero component on the site.

**The picture is the header. The text sits on it and must not hide it.**

From 640px up (tablet and desktop):

| Part | Rule |
|---|---|
| Position | content anchored bottom-left; the top of the frame stays clear. The description carries the width cap, so the CTA row can run to one line |
| Eyebrow | `text-xs uppercase tracking-[0.25em] font-medium text-white/80` |
| Headline | `text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.05] text-white` (36 / 48 / 60px). Never above 60px, never semibold or bold over a picture |
| Description | one paragraph at most, `text-sm sm:text-base lg:text-lg text-white/85 max-w-xl`. Secondary copy moves below the header |
| Scrim | black only, never a colour tint, and only behind the text band: a fade (`h-24 lg:h-32`) from clear to black at 65%, then 65% to 85% behind the text. Nothing darkens the top of the picture |
| Primary CTA on a picture | `bg-white text-brand-primary hover:bg-brand-sand` |
| Secondary CTA on a picture | `border border-white/50 text-white hover:bg-white/10` |

Below 640px (phones): if text over the picture would cover the subject's face, stack instead. The picture takes the top (320px on the homepage), the text sits on black beneath it, and the fade runs to solid black exactly where the picture ends so there is no seam. This is the homepage case: its video is a close-up of Suzanne.

Section headlines on flat grounds (not over a picture): `text-4xl lg:text-6xl font-medium tracking-tight`. Weight 500 is the measured reference weight; it replaces the 600 used since 20 Aug.

---

## 5. Grounds, buttons and labels

| | Light ground (white or light grey) | Dark ground (black) or picture |
|---|---|---|
| Section ground | `bg-brand-cream` (white) or `bg-brand-sand` (light grey), alternating | `bg-brand-primary-900` |
| Headline | `text-brand-primary` | `text-white` |
| Eyebrow label | `text-brand-accent` | `text-brand-accent-400` |
| Body | `text-brand-ink`, muted `text-brand-muted` | `text-white/80`, muted `text-white/70` |
| Primary CTA | `bg-brand-accent-600 hover:bg-brand-accent-700 text-white` | `bg-white hover:bg-brand-sand text-brand-primary` |
| Card | white card on light grey, or light grey card on white | `bg-brand-primary-700` or a photo card |

Never the same ground twice in a row. `MagazineCovers` takes a `tone` prop (`light` or `dark`) so each page can pick the one that does not match its neighbours.

**The easy mistake:** `bg-brand-accent` on a black ground. The accent is now near-black, so the button disappears. On dark grounds and pictures the CTA is always white.
