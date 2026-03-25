---
name: add-component
description: Create a new reusable React component. Use when the user asks to add, build, or create a UI component.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add Component

## Goal
Create a well-structured, typed React component in `components/`.

## Inputs
- Component name (PascalCase, e.g., `HeroSection`)
- What it renders and any props it accepts
- Whether it needs interactivity (`"use client"`) or is purely presentational (Server Component)

## Process

### Step 1 — Determine component type
- **Server Component** (default): No state, no browser APIs, no event handlers → no `"use client"`
- **Client Component**: Needs `useState`, `useEffect`, `onClick`, etc. → add `"use client"` at top

### Step 2 — Create the file
`components/<ComponentName>.tsx`

Structure:
```tsx
// "use client"  ← only if needed

import type { FC } from "react"

interface <ComponentName>Props {
  // define props here
}

const <ComponentName>: FC<<ComponentName>Props> = ({ ...props }) => {
  return (
    // JSX here
  )
}

export default <ComponentName>
```

### Step 3 — Code Review
Spawn `code-reviewer` agent on the new file. Fix any flagged issues.

### Step 4 — Wire up
Import and use in the calling page/layout. Verify `npm run build` passes.

## Rules
- TypeScript always — no `any` types
- Use `next/image` for images, not `<img>`
- Tailwind for all styling — no inline styles
- `"use client"` only when strictly necessary
