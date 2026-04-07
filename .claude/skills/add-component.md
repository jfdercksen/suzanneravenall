---
name: add-component
description: Create a new reusable React component. Use when the user asks to add, build, or create a UI component.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Add Component

## Inputs
- Component name (PascalCase)
- Where it lives: `packages/ui/src/` (shared) or `apps/web/components/` (app-specific)
- Props it accepts
- Whether it needs `"use client"` (state, effects, browser APIs)

## Process

### Step 1 — Check for existing components
```bash
find packages/ui/src apps/web/components -name "*.tsx" 2>/dev/null | head -20
```
Make sure a similar component does not already exist.

### Step 2 — Create the component file

**Shared component** (`packages/ui/src/{Name}.tsx`):
```tsx
export function {Name}({ ...props }: {Name}Props) {
  return (
    // JSX here
  )
}

export type {Name}Props = {
  // typed props here
}
```

**App-specific component** (`apps/web/components/{Name}.tsx`):
```tsx
export default function {Name}({ ...props }: {Name}Props) {
  return (
    // JSX here
  )
}

type {Name}Props = {
  // typed props here
}
```

### Step 3 — Export from index (shared components only)
Add to `packages/ui/src/index.ts`:
```typescript
export { {Name} } from "./{Name}"
```

### Step 4 — Spawn code-reviewer
Review the new component file.

### Step 5 — Spawn qa-unit
Generate and run tests for the component.

## Rules
- `"use client"` only when strictly needed — Server Components by default
- `next/image` instead of `<img>` — always
- `next/link` instead of `<a>` for internal links — always
- Tailwind classes only — no inline styles
- Mobile-first responsive design — Suzanne's audience is 60%+ mobile
- PascalCase filename matching component name
- Default export for page-level, named export for shared utility
