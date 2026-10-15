---
name: add-webhook
description: Add a new inbound webhook handler in Next.js that receives events from an external service and processes them in code (inline, with Next after(), or by handing off to the Medusa outbox). Use when any external service needs to send events to the platform. Always verify signatures.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add Webhook Handler

## Goal
Create a secure, production-ready inbound webhook handler that verifies the source, processes the payload and triggers the appropriate in-code automation. n8n is retired on this project (docs/n8n-migration-plan.md): never forward a webhook to n8n or add an `N8N_*` env var.

## Inputs
- Service sending the webhook (PayFast, Cal.com, Medusa, Vtiger)
- Event types to handle
- Signature verification method for that service
- What should happen when each event is received
- Where the work runs: inline in the route, after the 200 with Next `after()`, or as a Medusa outbox job when it must survive a restart

## Key References
- Next.js route handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- PayFast ITN: https://developers.payfast.co.za/docs#notify_validate
- Cal.com webhooks: https://cal.com/docs/core-features/webhooks
- Resend webhooks: https://resend.com/docs/dashboard/webhooks/introduction

## Project Structure
- Webhook handlers: `apps/web/app/api/webhooks/{service}/route.ts`
- Signature verification: `apps/web/src/lib/webhooks/verify.ts`
- Webhook types: `apps/web/src/lib/webhooks/types.ts`

## Process

### Step 1 — Research signature verification
Spawn research agent:
"How does {service} sign webhook payloads? What header contains the signature? What algorithm is used (HMAC-SHA256, RSA, custom)? Read {service webhook docs URL} and return the exact verification method."

### Step 2 — Add verification to lib
File: `apps/web/src/lib/webhooks/verify.ts`
```typescript
import crypto from "crypto"
import { NextRequest } from "next/server"

// Generic HMAC-SHA256 verification
export async function verifyHmacSignature(
  request: NextRequest,
  secret: string,
  headerName: string
): Promise<boolean> {
  const signature = request.headers.get(headerName)
  if (!signature) return false

  const body = await request.text()
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

// PayFast ITN verification (custom — must call PayFast validation endpoint)
export async function verifyPayFastITN(
  payload: Record<string, string>
): Promise<boolean> {
  const params = new URLSearchParams(payload)
  const response = await fetch(
    `https://www.payfast.co.za/eng/query/validate?${params}`
  )
  const text = await response.text()
  return text.trim() === "VALID"
}
```

### Step 3 — Create the webhook handler
File: `apps/web/app/api/webhooks/{service}/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { verifyHmacSignature } from "@/lib/webhooks/verify"

// Disable body parsing — needed for raw body signature verification
export const config = {
  api: { bodyParser: false }
}

export async function POST(request: NextRequest) {
  try {
    // Step 1 — Verify signature FIRST, before anything else
    const isValid = await verifyHmacSignature(
      request,
      process.env.{SERVICE}_WEBHOOK_SECRET!,
      "x-{service}-signature"
    )

    if (!isValid) {
      console.error("{Service} webhook: invalid signature")
      return NextResponse.json(
        { error: "Unauthorised" },
        { status: 401 }
      )
    }

    // Step 2 — Parse payload
    const payload = await request.json()
    const eventType = payload.type || payload.event

    // Step 3 — Return 200 immediately
    const response = NextResponse.json({ received: true })

    // Step 4 — Process async
    handleWebhookAsync(eventType, payload).catch(err => {
      console.error("{Service} webhook processing error:", err)
    })

    return response

  } catch (error) {
    console.error("{Service} webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function handleWebhookAsync(
  eventType: string,
  payload: unknown
): Promise<void> {
  // Process in code: call the shared client from packages/integrations
  // (for example syncBookingToVtiger) with retry inside the client, or
  // enqueue a Medusa outbox job when the work must survive a restart.
  // Log the final failure with logError (Sentry); never swallow it.
  await run{Service}Automation(eventType, payload)
}
```

### Step 4 — Add webhook types
File: `apps/web/src/lib/webhooks/types.ts`
```typescript
// Add typed payload interfaces for each service
export interface {Service}WebhookPayload {
  type: string
  // add all expected fields
}
```

### Step 5 — Register webhook URL in external service
Document exactly where to register:
- PayFast: Merchant dashboard → Notifications → ITN URL
- Cal.com: Settings → Developer → Webhooks → Add webhook
- Medusa: `apps/medusa/medusa-config.ts` → subscriberExecution

### Step 6 — Add environment variables to .env.example
{SERVICE}_WEBHOOK_SECRET=
(no N8N_* variables: n8n is retired on this project)

### Step 7 — Spawn integration-agent
Ask integration-agent to review the signature verification implementation.

### Step 8 — Spawn code-reviewer
Ask code-reviewer to review the handler file.

### Step 9 — Spawn qa-unit
Ask qa-unit to write tests — mock fetch calls, test valid and invalid signatures.

## Signature Verification by Service

| Service | Header | Algorithm | Notes |
|---------|--------|-----------|-------|
| PayFast | None | Custom | Call PayFast validation endpoint |
| Cal.com | X-Cal-Signature-256 | HMAC-SHA256 | Compare with webhook secret |
| Resend | svix-signature | SVIX | Use svix library |
| Medusa | x-medusa-signature | HMAC-SHA256 | Medusa webhook secret |

## Rules
- Signature verification is mandatory — never skip it for any webhook
- Always return 200 immediately — never make external service wait for processing
- Process webhooks asynchronously after returning 200
- Never log full payload if it may contain PII or payment data
- Always handle the case where the in-code processing fails - log to Sentry, and use the outbox when the work must not be lost on a restart
- Never forward to n8n and never add an `N8N_*` env var: n8n is retired here (docs/n8n-migration-plan.md)
- Test with both valid and invalid signatures before going live
- Register webhook URLs in external service dashboards and document them

## Output Format
Always report:
- Service and event types handled
- Signature verification method used
- Webhook URL to register in external service dashboard
- Environment variables added
- Automation triggered (in-process handler or outbox job), if applicable
- Test results — valid signature, invalid signature, missing signature
