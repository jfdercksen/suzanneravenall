---
name: design-from-reference
description: Build a Next.js page and its components from a reference screenshot or written brief. Use when the user asks to build, create, or add a new page based on a design.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Design from Reference

## Inputs
- Reference image path or written design brief
- Target route (e.g., `/about`)
- Brand tokens: Primary #1A3A5C, Accent #E8733A, Background #F5F5F5, Text #333333

## Process

### Step 1 — Analyse the reference
Read the reference image or brief. Identify:
- Sections (hero, features, testimonials, CTA, etc.)
- Layout structure (grid, flex, single column)
- Typography hierarchy (h1, h2, body, caption)
- Color usage against brand tokens
- Interactive elements (buttons, forms, accordions)
- Responsive breakpoints needed

### Step 2 — Plan component breakdown
List every component needed. Prefer flat structure — only extract a component if it is genuinely reused or complex.

### Step 3 — Build mobile-first
Start with the 375px layout, then add responsive breakpoints:
- `sm:` (640px)
- `md:` (768px)
- `lg:` (1024px)
- `xl:` (1280px)

### Step 4 — Create components
Build each component as a separate file in `apps/web/components/`.

### Step 5 — Assemble the page
Create `apps/web/app/{route}/page.tsx` importing all components.

### Step 6 — Spawn qa-visual
Screenshot the result at 375px, 768px, and 1280px and compare against reference.

### Step 7 — Spawn code-reviewer
Review all new files.

## Rules
- Match the reference exactly — do not add sections or features not in the spec
- Tailwind classes only — no inline styles
- `next/image` for all images
- `next/link` for all internal links
- Server Components by default
- Mobile-first — small screen layout first, then scale up
- Use brand tokens from CLAUDE.md — do not invent colours
