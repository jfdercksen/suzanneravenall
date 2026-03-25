---
name: add-api-route
description: Add a new API route handler. Use when the user asks to add a backend endpoint, API handler, or server action.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add API Route

## Goal
Create a typed Next.js API route handler at `app/api/<route>/route.ts`.

## Inputs
- Endpoint path (e.g., `/api/contact`, `/api/generate`)
- HTTP method (GET, POST, etc.)
- Expected request body and response shape
- Any secrets or external APIs needed

## Process

### Step 1 — Create the route file
`app/api/<route>/route.ts`

### Step 2 — Handler template
```ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    if (!body.requiredField) {
      return NextResponse.json(
        { error: "Missing required field" },
        { status: 400 }
      )
    }

    // Your logic here
    // Access secrets via process.env.SECRET_NAME (never NEXT_PUBLIC_)

    return NextResponse.json({ result: "..." })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### Step 3 — Environment variables
- Add any new secrets to `.env.local` and `.env.example`
- Never use `NEXT_PUBLIC_` prefix for server-side secrets

### Step 4 — Code Review + QA
Spawn `code-reviewer` on the new file. Then spawn `qa` to generate and run tests.
Fix all issues before finishing.

### Step 5 — Build Check
```bash
npm run build
```

## Rules
- Always validate request body at the top — return 400 for missing/invalid fields
- All secrets via `process.env` — never hardcoded
- Always wrap handler body in try/catch — return 500 with error message
- Return `NextResponse.json()` always, never plain `Response`
