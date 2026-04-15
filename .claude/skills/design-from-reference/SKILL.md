---
name: design-from-reference
description: Build a Next.js page and its components from a reference screenshot or written brief. Use when the user asks to build, create, or add a new page based on a design.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Design From Reference — Suzanne Ravenall Platform

## Design Standard
Every page and component built for this project must match the cinematic, 
high-motion quality of tonyrobbins.com. The bar is set there. Generic, 
static, flat pages are NOT acceptable output.

## Brand Tokens (always use — never hardcode)
- Navy: #012B43 (bg-brand-navy)
- Electric blue: #1719F4 (bg-brand-electric)
- Font: Poppins (weights 200–700) — font-display for headlines, font-body for text
- Logos: apps/web/public/logos/
- All tokens defined in tailwind.config.ts — use them

## The Tony Robbins Design Standard
Study tonyrobbins.com before building anything. The defining characteristics:

### 1. Cinematic Hero
- Full-screen video OR full-bleed high-contrast image — never a small contained box
- Dark gradient overlay: from-black/70 via-black/40 to-transparent
- Single bold headline — max 6 words, font-light, text-5xl md:text-7xl lg:text-8xl
- Subheadline — max 12 words, muted white
- Dual CTAs: primary (solid brand-electric) + secondary (outline white)
- All elements animate in on load using framer-motion stagger

### 2. Motion on Everything
Every section must have scroll-triggered entrance animations via framer-motion:
```tsx
// Standard section entrance — use on every section wrapper
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
```
Stagger children with 0.1s delay increments.
Numbers/stats count up when scrolled into view.
Images have subtle parallax using useScroll + useTransform.

### 3. Dark Sections with Visual Weight
- Alternate dark (bg-gray-950, bg-brand-navy) and light sections — never same bg twice in a row
- Dark sections: white text, electric blue accents
- Full-bleed sections — no max-width containers on the section background itself
- Content inside uses max-w-7xl mx-auto px-4

### 4. Cards with Depth and Hover
- Dark bg (bg-gray-900) with background image overlay at opacity-40
- On hover: overlay fades to opacity-20, card lifts with shadow-2xl
- group + group-hover Tailwind pattern for coordinated hover effects
- transition-all duration-500 on all interactive elements

### 5. Typography Hierarchy
- Section labels: text-xs uppercase tracking-[0.3em] text-brand-electric font-medium
- Section headlines: text-4xl md:text-5xl lg:text-6xl font-light text-white or text-brand-navy
- Body: text-lg text-gray-300 (on dark) or text-gray-600 (on light)
- Result callouts: text-brand-electric text-2xl font-semibold
- Never use default font weights — always be explicit

### 6. Full-Bleed Testimonials
- Portrait photos at full section height — not avatar circles
- Result in large brand-electric text above the quote
- Client name + role below
- Dark background with subtle texture or gradient

### 7. Pulsing Final CTA
- Full-bleed dark section, large headline, single button
- Button has CSS keyframe pulse-glow animation using brand-electric shadow

## Required Dependencies
Always check framer-motion is installed:
```bash
npm list framer-motion || npm install framer-motion
```

## Component Rules
- Animated components MUST have "use client" directive
- Keep Server Components as page wrappers — only animated children need "use client"
- whileInView with once: true — never re-animate on scroll back
- All images: next/image with explicit width/height — never layout shift
- All internal links: next/link — never bare <a>

## Goal
Implement a pixel-accurate Next.js page by creating a page.tsx and any 
required components, matching the cinematic standard above.

## Inputs
- Reference screenshot (preferred) OR written description of the page
- Route path (e.g., /about, /services)
- Design system tokens from CLAUDE.md

## Process

### Step 1 — Break the design into components
- Reusable sections → components/home/ or components/shared/
- Page-specific → inline in page.tsx
- Any interactivity or animation → "use client"

### Step 2 — Create the files
```
app/<route>/page.tsx
components/<section>/<SectionName>.tsx
```

Always export metadata:
```tsx
export const metadata = {
  title: "<Page Title> | Suzanne Ravenall",
  description: "<SEO description>",
}
```

### Step 3 — Implement to the standard
- Motion on every section (see patterns above)
- Dark/light alternating sections
- Cinematic hero if this is the homepage or a landing page
- Cards with hover depth effects
- Stats count up on scroll

### Step 4 — Screenshot & Compare
```bash
npm run dev
npx puppeteer screenshot http://localhost:3000/<route> --fullpage
```
Ask: "Does this look as cinematic and high-motion as tonyrobbins.com?"
If no — fix it before proceeding. Minimum 2 comparison rounds.

### Step 5 — Code Review + Build Check
Spawn code-reviewer on new files. Then:
```bash
npm run build
```
Fix all TypeScript errors before finishing.

## Quality Gate
Before marking any page task complete, ask:
1. Does every section animate in on scroll?
2. Are sections alternating dark/light?
3. Is the hero full-bleed and cinematic?
4. Do cards have hover depth effects?
5. Is there a pulsing final CTA?

If any answer is no — the task is NOT done.