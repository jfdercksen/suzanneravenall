---
name: design-from-reference
description: Build a Next.js page and its components from a reference screenshot or written brief. Use when the user asks to build, create, or add a new page based on a design.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Design From Reference

## Goal
Implement a pixel-accurate Next.js page by creating a `page.tsx` and any required components, matching a reference screenshot or written spec.

## Inputs
- Reference screenshot (preferred) OR written description of the page
- Route path (e.g., `/about`, `/services`)
- Design system tokens from CLAUDE.md (colors, fonts, corner radii)

## Process

### Step 1 — Break the design into components
Look at the reference and identify distinct sections:
- Which sections are reusable → `components/`
- Which are page-specific → inline in `page.tsx`
- Which need interactivity → mark as `"use client"`

### Step 2 — Create the files
```
app/<route>/page.tsx          ← page shell + metadata
components/<SectionName>.tsx  ← one file per reusable section
```

Always add metadata:
```tsx
export const metadata = {
  title: "<Page Title> | <Site Name>",
  description: "<SEO description>",
}
```

### Step 3 — Implement with Tailwind
- Use design system tokens from CLAUDE.md
- Mobile-first responsive layout
- `next/image` for all images
- `next/link` for internal links
- No inline styles — Tailwind classes only

### Step 4 — Screenshot & Compare
Start dev server if not running:
```bash
npm run dev
```
Then use `screenshot-compare` skill:
```bash
npx puppeteer screenshot http://localhost:3000/<route> --fullpage
```
Compare against reference. Note every mismatch (px-level).

### Step 5 — Fix & Re-screenshot
Fix all mismatches. Re-screenshot. Repeat until within ~2–3px of reference.
Minimum 2 comparison rounds before stopping.

### Step 6 — Code Review + Build Check
Spawn `code-reviewer` on new files. Fix issues. Then:
```bash
npm run build
```
Fix any type errors before finishing.

## Rules
- TypeScript always — no `any` types
- `next/image` not `<img>`, `next/link` not `<a>`
- `"use client"` only when the component truly needs it
- Match the reference exactly — do not add sections not in the design
- Corner radii from design system — no pills unless design requires it
