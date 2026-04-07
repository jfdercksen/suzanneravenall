---
name: add-api-route
description: Add a new API route handler. Use when the user asks to add a backend endpoint, API handler, or server action.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Add API Route

## Inputs
- Route path (e.g., `/api/members/profile`)
- HTTP methods (GET, POST, PUT, DELETE)
- Whether it requires authentication
- Input schema (what data it accepts)
- What it returns

## Process

### Step 1 — Check existing API routes
```bash
find apps/web/app/api -name "route.ts" 2>/dev/null
```

### Step 2 — Create the route handler
File: `apps/web/app/api/{path}/route.ts`

```typescript
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  // define input validation
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 1. Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    // 2. Validate input
    const body = await request.json()
    const validated = schema.parse(body)

    // 3. Business logic (RLS enforced automatically)
    const { data, error } = await supabase
      .from("table")
      .select("*")

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

### Step 3 — Spawn code-reviewer
Review the route handler for security and correctness.

### Step 4 — Spawn qa-unit
Generate and run tests with mocked Supabase client.

## Rules
- Always validate input with Zod — never trust raw request body
- Always check authentication before processing
- Always wrap in try/catch — never let unhandled errors leak
- Never expose internal error details in responses
- Never expose secrets or internal paths in error messages
- Use Supabase RLS — never implement access control in application code alone
- Log errors to Sentry in catch blocks
