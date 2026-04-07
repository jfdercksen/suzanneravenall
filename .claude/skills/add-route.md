---
name: add-route
description: Add a new page route to the Next.js app. Use when the user asks to add a new page, route, or section of the site.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Add Route

## Inputs
- Route path (e.g., `/services/coaching`)
- Page title and purpose
- Whether it requires authentication
- Reference design (screenshot or written brief) if available

## Process

### Step 1 — Check route map
Read `CLAUDE.md` and check the route map to avoid conflicts.

### Step 2 — Create the page file
File: `apps/web/app/{route}/page.tsx`

```tsx
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "{Page Title} | Dr. Suzanne Ravenall",
  description: "{SEO description}",
}

export default function {PageName}Page() {
  return (
    <main>
      {/* Page content */}
    </main>
  )
}
```

### Step 3 — Add loading and error states
Create `apps/web/app/{route}/loading.tsx` and `apps/web/app/{route}/error.tsx`.

### Step 4 — Add auth guard (if protected)
For `/portal/*` routes, add layout with auth check:
```tsx
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export default async function PortalLayout({ children }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  return <>{children}</>
}
```

### Step 5 — Update CLAUDE.md route map
Add the new route to the route map table in `CLAUDE.md`.

### Step 6 — Spawn code-reviewer + qa-visual
Review the page and screenshot it against reference if available.

## Rules
- Server Component by default — no `"use client"` unless needed
- Always set `metadata` for SEO
- Always create `loading.tsx` for pages with data fetching
- Mobile-first layout — Tailwind responsive classes
- All portal routes must check auth
