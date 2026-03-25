---
name: add-route
description: Add a new page route to the Next.js app. Use when the user asks to add a new page, route, or section of the site.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add Route

## Goal
Create a new page at the correct App Router path with proper metadata and layout.

## Inputs
- Route path (e.g., `/about`, `/dashboard/settings`)
- What the page should render
- Any data it needs to fetch

## Process

### Step 1 — Create the directory and page file
```
app/<route>/page.tsx
```

For nested routes:
```
app/<parent>/<child>/page.tsx
```

### Step 2 — Page structure
```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "<Page Title> | <Site Name>",
  description: "<Page description for SEO>",
}

export default function <PageName>Page() {
  return (
    <main>
      {/* page content */}
    </main>
  )
}
```

### Step 3 — Add supporting files if needed
- `app/<route>/loading.tsx` — loading skeleton
- `app/<route>/error.tsx` — error boundary (requires `"use client"`)

### Step 4 — Update navigation
Add the new route to any nav components that list pages.

### Step 5 — Code Review + Build Check
Spawn `code-reviewer` on the new file. Then run:
```bash
npm run build
```
Fix any type errors or build failures before finishing.

## Rules
- Always export `metadata` with `title` and `description`
- Server Component by default — only use `"use client"` if the page itself needs interactivity
- Use `next/link` for internal links, not `<a>` tags
